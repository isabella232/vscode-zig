'use strict';
import * as vscode from 'vscode';
import { CommandHandler } from './CommandHandler';

var last_command: string = null;

export function activate(context: vscode.ExtensionContext) {
    // Provider for all the available runnable zig tasks
    context.subscriptions.push(vscode.commands.registerCommand('zig.build.getTargets', chooseBuildTarget));

    // Shortcut to run the last ran target or prompt if there was no last ran
    context.subscriptions.push(vscode.commands.registerCommand('zig.build.getLastTargetOrPrompt', () => {
        if (last_command != null) return last_command;
        return chooseBuildTarget();
    }));

    // builds the last chosen target
    context.subscriptions.push(
        vscode.commands.registerCommand('zig-build-last-target', async () => {
            vscode.tasks.executeTask(await getBuildTask("Build", "Zig build last target"));
        })
    );

    // same as above but forces a prompt for the target
    context.subscriptions.push(
        vscode.commands.registerCommand('zig-build-target', async () => {
            vscode.tasks.executeTask(await getBuildTask("Build", "Zig build last target", true));
        })
    );

    // provides a build last target task that appears in the command palatte
    vscode.tasks.registerTaskProvider("zig-build-last-target", {
        async provideTasks(token?: vscode.CancellationToken) {
            let command = last_command != null ? last_command : await chooseBuildTarget();
            last_command = command;
            var execution = new vscode.ShellExecution("zig build " + command);
            return [
                new vscode.Task({ type: "zig-build-last-target" }, vscode.TaskScope.Workspace,
                    "Build", "Zig build last target", execution, ["$gcc"])
            ];
        },

        resolveTask(task: vscode.Task, token?: vscode.CancellationToken) {
            return task;
        }
    });
}

// uses showQuickPick to let you choose a zig build target
function chooseBuildTarget() {
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
}

// fetches a Task that optionally prompts for a build target that can be run
async function getBuildTask(name: string, source: string, force_target_prompt: boolean = false) {
    let command = last_command != null && !force_target_prompt ? last_command : await chooseBuildTarget();
    var execution = new vscode.ShellExecution("zig build " + command);
    return new vscode.Task({ type: "zig-build-last-target" }, vscode.TaskScope.Workspace,
            name, source, execution, ["$gcc"]);
}
