'use strict';
import * as vscode from 'vscode';
import * as subprocess from 'child_process';
import { CommandHandler } from './CommandHandler';

var last_command: string = null;

export function activate(context: vscode.ExtensionContext) {
    const callback = () => {
        try {
            const handler = new CommandHandler();
            let target = handler.handle();
            target.then(value => last_command = value);
            return target;
        } catch (error) {
            const message = (error instanceof Error) ? error.message : 'Error executing shell command: ' + error;
            console.error(error);
            vscode.window.showErrorMessage(message);
        }
    };

    // Provider for all the available runnable zig tasks
    context.subscriptions.push(vscode.commands.registerCommand('zig.build.getTargets', callback));

    // Shortcut to run the last ran target or prompt if there was no last ran
    context.subscriptions.push(vscode.commands.registerCommand('zig.build.getLastTargetOrPrompt', () => {
        if (last_command != null) return last_command;
        return callback();
    }));

    context.subscriptions.push(
        vscode.commands.registerCommand('zig.build-last-target', async () => {
            let command = last_command != null ? last_command : await callback();

            var term = vscode.window.activeTerminal;
            term.show();
            await vscode.commands.executeCommand('workbench.action.terminal.clear');
            term.sendText("zig build " + command);

            // TODO: one day figure out how to use a subprocess and pipe the outout to the Output pane
            // let buildOut = vscode.window.createOutputChannel("zig-build");
            // buildOut.show();
            // buildOut.append("----- go");

            // let zig = subprocess.spawn("zig build " + command);
            // buildOut.appendLine(zig.stdout.read());
            // buildOut.appendLine(zig.stderr.read());

            // let buffer = "";
            // zig.stderr.on("data", data => {
            //     let text = data.toString();
            //     if (text.length > 0) {
            //         buffer += "\n" + text;
            //         buildOut.appendLine(text);
            //     }
            // });

            // zig.on("close", code => {
            //     buildOut.appendLine("Code: " + code.toString());
            // });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('zig.build-target', async () => {
            let command = await callback();

            var term = vscode.window.activeTerminal || vscode.window.createTerminal();
            term.show();
            await vscode.commands.executeCommand('workbench.action.terminal.clear');
            term.sendText("zig build " + command);
        })
    );
}
