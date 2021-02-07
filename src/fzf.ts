import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as cp from 'child_process';

let fzfTerminal: vscode.Terminal | undefined = undefined;
let initialCwd: string;
let rgCaseFlag: string = '--smart-case'; // --case-sensitive, --ignore-case
let fzfPipe: string | undefined;
let fzfPipeScript: string;

export const TERMINAL_NAME = 'fzf terminal';

export function activate(context: vscode.ExtensionContext) {
	// no windows support
	if (process.platform === 'win32') return;

	setupPOSIXPipe();
	fzfPipeScript = vscode.extensions.getExtension('prime31.zig')?.extensionPath ?? "";
	fzfPipeScript = path.join(fzfPipeScript, 'scripts', 'topipe.sh');

	context.subscriptions.push(vscode.commands.registerCommand('zig.fzf.runFzfSearch', async () => {
		let pattern = await getSearchText();
		if (pattern === undefined) {
			return;
		}
		fzfTerminal = showFzfTerminal(TERMINAL_NAME, fzfTerminal);
		fzfTerminal.sendText(makeSearchCmd(pattern), true);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('zig.fzf.runFzfFile', () => {
		fzfTerminal = showFzfTerminal(TERMINAL_NAME, fzfTerminal);
		fzfTerminal.sendText(getCodeOpenFileCmd(), true);
	}));

	vscode.window.onDidCloseTerminal((terminal) => {
		switch (terminal.name) {
			case TERMINAL_NAME:
				fzfTerminal = undefined;
				break;
		}
	});
}

export function deactivate() {
	if (fzfPipe) {
		fs.unlinkSync(fzfPipe);
		fzfPipe = undefined;
	}
}

function showFzfTerminal(name: string, fzfTerminal: vscode.Terminal | undefined): vscode.Terminal {
	if (!fzfTerminal) {
		// Look for an existing terminal
		fzfTerminal = vscode.window.terminals.find((term) => { return term.name === name; });
    }

	if (!fzfTerminal) {
		// Create an fzf terminal
		//if (!initialCwd && vscode.window.activeTextEditor)
		//	initialCwd = path.dirname(vscode.window.activeTextEditor.document.fileName);

		initialCwd = initialCwd || '';
		fzfTerminal = vscode.window.createTerminal({
			cwd: initialCwd,
			name: name
		});
    }

	fzfTerminal.show();
	return fzfTerminal;
}

async function getSearchText(): Promise<string | undefined> {
	let activeSelection = vscode.window.activeTextEditor?.selection;
	let value: string | undefined = undefined;

	if (activeSelection) {
		let activeRange: vscode.Range | undefined;
		if (activeSelection.isEmpty) {
			activeRange = vscode.window.activeTextEditor?.document.getWordRangeAtPosition(activeSelection.active);
		} else {
			activeRange = activeSelection;
		}
		value = activeRange ? vscode.window.activeTextEditor?.document.getText(activeRange) : undefined
	}

	let pattern = await vscode.window.showInputBox({
		prompt: "Search pattern",
		value: value
	});
	return pattern;
}

function setupPOSIXPipe() {
	let idx = 0;
	while (!fzfPipe && idx < 10) {
		try {
			let pipe = path.join(os.tmpdir(), `fzf-pipe-${process.pid}`);
			if (idx > 0) { pipe += `-${idx}`; }
			cp.execSync(`mkfifo -m 600 ${pipe}`);
			fzfPipe = pipe;
		} catch (e) {
			// Try again for a new address
			++idx;
		}
	}
	listenToFifo(fzfPipe as string);
}

function getPath(arg: string, pwd: string): string | undefined {
	if (!path.isAbsolute(arg))
		arg = path.join(pwd, arg);

	if (fs.existsSync(arg)) {
		return arg;
	} else {
		return undefined;
	}
}

function processCommandInput(data: Buffer) {
	let [cmd, pwd, arg] = data.toString().trim().split('$$');
	cmd = cmd.trim(); pwd = pwd.trim(); arg = arg.trim();

	if (arg === "") return;
	if (cmd === 'open') {
		let filename = getPath(arg, pwd);
		if (!filename) { return }
		vscode.window.showTextDocument(vscode.Uri.file(filename));
		fzfTerminal.hide();
	} else if (cmd === 'add') {
		let folder = getPath(arg, pwd);
		if (!folder) { return }
		vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, {
			uri: vscode.Uri.file(folder)
		});
		vscode.commands.executeCommand('workbench.view.explorer');
	} else if (cmd === 'rg') {
		let [file, linestr, colstr] = arg.split(':');
		let filename = getPath(file, pwd);
		if (!filename) { return };
		let line = parseInt(linestr) - 1;
		let col = parseInt(colstr) - 1;
		vscode.window.showTextDocument(vscode.Uri.file(filename)).then((ed) => {
			let start = new vscode.Position(line, col);
			ed.selection = new vscode.Selection(start, start);
			ed.revealRange(new vscode.Range(start, start));
		})
	}
}

function listenToFifo(fifo: string) {
	fs.open(fifo, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK , (err, fd) => {
		const pipe = new net.Socket({fd: fd, allowHalfOpen: true });
		pipe.on('data', (data) => {
			processCommandInput(data);
			fzfTerminal.hide();
		})
		pipe.on('end', () => {
			listenToFifo(fifo);
		})
	})
}

function getCodeOpenFileCmd() {
	return `fzf | ${fzfPipeScript} open ${fzfPipe}`;
}

function makeSearchCmd(pattern: string): string {
	return `rg '${pattern}' ${rgCaseFlag} --vimgrep --color ansi | fzf --ansi | ${fzfPipeScript} rg "${fzfPipe}"`;
}