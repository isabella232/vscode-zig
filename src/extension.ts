'use strict';
import * as vscode from 'vscode';
import { CommandHandler } from './CommandHandler';
import * as zls from './ZLS'
import * as macros from './Macros'

var last_command: string = null;

export function activate(context: vscode.ExtensionContext) {
    // zls
    if (!vscode.workspace.getConfiguration('zigLanguageClient').get('disabled', true))
        zls.activate(context);

    // macros/multi-command
    macros.activate(context)

    // Provider for all the available runnable zig tasks
    context.subscriptions.push(vscode.commands.registerCommand('zig.build.getTargets', chooseBuildTarget));

    // Shortcut to run the last ran target or prompt if there was no last ran
    context.subscriptions.push(vscode.commands.registerCommand('zig.build.getLastTargetOrPrompt', () => {
        if (last_command != null) return last_command;
        return chooseBuildTarget();
    }));

    // builds the last chosen target
    context.subscriptions.push(
        vscode.commands.registerCommand('zig.buildLastTarget', async () => {
            vscode.tasks.executeTask(await getBuildTask("Build", "Zig build last target"));
        })
    );

    // same as above but forces a prompt for the target
    context.subscriptions.push(
        vscode.commands.registerCommand('zig.buildTarget', async () => {
            vscode.tasks.executeTask(await getBuildTask("Build", "Zig build force choose target", true));
        })
    );

    // provides a build last target task that appears in the command palatte
    vscode.tasks.registerTaskProvider("zig.buildLastTarget", {
        async provideTasks(token?: vscode.CancellationToken) {
            return [await getBuildTask("Build", "Zig build last target", false)];
        },

        resolveTask(task: vscode.Task, token?: vscode.CancellationToken) {
            return task;
        }
    });
}

export function deactivate() {
    if (vscode.workspace.getConfiguration('zigLanguageClient').get('disabled', true))
        return zls.deactivate();
    return null; 5
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
    if (command == undefined || command.length == 0) {
        throw Error("No build task selected. Aborting 'zig build'");
    } else {
        // var execution = new vscode.ShellExecution("zig build " + command);
        let env : { [key: string]: string} = {};
        env["ZIG_SYSTEM_LINKER_HACK"] = "1";
        var execution = new vscode.ShellExecution("zig build " + command, {
            env: env
        });
        return new vscode.Task({ type: "zig.buildLastTarget" }, vscode.TaskScope.Workspace,
            name, source, execution, ["$gcc"]);
    }
}
