import * as vscode from "vscode";

export class Command {
    constructor(private readonly exe: string, private readonly args: object | null) {}

    public execute() {
        if (this.args === null) {
            return vscode.commands.executeCommand(this.exe)
        } else {
            return vscode.commands.executeCommand(this.exe, this.args)
        }
    }
}

export class MultiCommand {
    constructor(readonly id: string,
                readonly label: string | undefined,
                readonly description: string | undefined,
                readonly interval: number | undefined,
                readonly sequence: Array<Command>) {}

    public async execute() {
        for (let command of this.sequence) {
            await command.execute();
            await delay(this.interval || 0);
        }
    }
}

function delay(ms: number) {
    if (ms > 0) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}


interface CommandSettings{
    command: string,
    label: string,
    description: string,
    interval: number,
    sequence: Array<string | ComplexCommand>
}

interface ComplexCommand {
    command: string,
    args: object
}

let multiCommands: Array<MultiCommand>;

function refreshUserCommands(context: vscode.ExtensionContext) {
    let configuration = vscode.workspace.getConfiguration("zig.multiCommand");
    let commands = configuration.get<Array<CommandSettings>>("commands");

    // Dispose current settings.
    for (let element of context.subscriptions) {
        element.dispose();
    }

    if (!commands) {
        return;
    }
    multiCommands = [];

    for (let commandSettings of commands) {
        const id = commandSettings.command;
        const label = commandSettings.label;
        const description = commandSettings.description;
        const interval = commandSettings.interval;
        const sequence = commandSettings.sequence.map(command => {
            let exe: string;
            let args: object | null;
            if (typeof(command) === "string" ) {
                exe = command;
                args = null;
            } else {
                exe = command.command;
                args = command.args;
            }
            return new Command(exe, args);
        });


        const multiCommand = new MultiCommand(id, label, description, interval, sequence);
        multiCommands.push(multiCommand);

        context.subscriptions.push(vscode.commands.registerCommand(id, async () => {
            await multiCommand.execute();
        }));
    }

}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    refreshUserCommands(context);

    vscode.workspace.onDidChangeConfiguration(() => {
        refreshUserCommands(context);
    });

    vscode.commands.registerCommand('zig.multiCommand.execute', async (args = {}) => {
        try {
            if (args.command) {
                await vscode.commands.executeCommand(args.command);
            } else {
                await pickMultiCommand();
            }
        }
        catch (e) {
            vscode.window.showErrorMessage(`${e.message}`);
        }
    });

}

export async function pickMultiCommand() {
    const picks = multiCommands.map(multiCommand => {
        return {
            label: multiCommand.label || multiCommand.id,
            description: multiCommand.description || "",
            multiCommand: multiCommand
        }
    });

    const item = await vscode.window.showQuickPick(picks, {
        placeHolder: `Select one of the multi commands...`,
    });

    if (!item) {
        return;
    }
    await item.multiCommand.execute();
}