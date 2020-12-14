import * as vscode from 'vscode';
import * as subprocess from 'child_process';

export class CommandHandler {
    protected command: string = "zig build --help";
    protected EOL: RegExp = /\r\n|\r|\n/;
    protected inputOptions: vscode.QuickPickOptions = {
        canPickMany: false
    };

    constructor() {}

    handle() {
        const result = this.runCommand();
        const nonEmptyInput = this.parseResult(result);
        return vscode.window.showQuickPick(nonEmptyInput, { "placeHolder": "Select the zig target to run" });
    }

    protected runCommand() {
        const options: subprocess.ExecSyncOptionsWithStringEncoding = {
            encoding: 'utf8',
            cwd: vscode.workspace.workspaceFolders![0].uri.fsPath,
            shell: vscode.env.shell
        };

        return subprocess.execSync(this.command!, options);
    }

    protected parseResult(result: string) {
        let lines = result.split(this.EOL);
        var results = [];

        var inSteps = false;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].includes("Steps:")) {
                inSteps = true;
                i += 2;
                continue;
            }

            if (inSteps && lines[i].includes("General Options:")) {
                break;
            }

            if (inSteps) {
                let match = lines[i].trim().match(/^([\w-]+)/);
                if (match)
                    results.push(match[0]);
            }
        }

        return results.filter((value: string) => value && value.trim().length > 0);
    }

    protected quickPick(input: string[]) {
        return vscode.window.showQuickPick(input, this.inputOptions);
    }
}