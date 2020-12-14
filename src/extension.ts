'use strict';
import * as vscode from 'vscode';
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
    const disposable = vscode.commands.registerCommand('zig.build.getTargets', callback);
    context.subscriptions.push(disposable);

    // Shortcut to run the last ran target or prompt if there was no last ran
    const disposable2 = vscode.commands.registerCommand('zig.build.getLastTargetOrPrompt', () => {
        if (last_command != null) return last_command;
        return callback();
    });
    context.subscriptions.push(disposable2);
}

export function deactivate() {}
