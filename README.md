# Zig Builder + ZLS + Zig Language Extension
Smashes together the [VSCode Zig Extension](https://github.com/ziglang/vscode-zig) the almighty [ZLS](https://github.com/zigtools/zls-vscode) and [multi-command macros](https://github.com/ryuta46/vscode-multi-command) and [ripgrep/fzf](https://github.com/rlivings39/vscode-fzf-quick-open) and then adds on top build commands that parse your `zig build --help` output letting you select your build target easily.

![](./images/example.png)


## Features
 - provides a parser for finding `zig build` targets
 - keyboard shortcut and VS Code commands for building the last target or choosing a target to build
 - comes pre-packed with [ZLS](https://github.com/zigtools/zls-vscode) so you can use just one Zig extension (disabled by default, enable via `zigLanguageClient.disabled`)


## Usage
### Direct Builds
- `cmd/ctrl+shift+r` runs the `zig.buildLastTarget` command which will prompt you for a target the first time it is run and run it directly thereafter
- `cmd/ctrl+shift+alt+r` runs the `zig.buildTarget` command which will always prompt you for a target
- you can also can wire those commands up to whatever keybindings you want or use the command palette to run them


### Advanced (you can probably stop reading now)

#### Using tasks.json
Open your `tasks.json` file and create two new build tasks (the second is optional). Pay close attention to the `input:` substitution in the build command and the relevant providers in the `inputs` section.

```json
{
    "tasks": [
        {
            "label": "Build and Run Specific Target",
            "type": "shell",
            "command": "zig build ${input:zigTarget}",
            "problemMatcher": [
                "$gcc"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "clear": true
            }
        },
        {
            "label": "Build and Run Last Target",
            "type": "shell",
            "command": "zig build ${input:zigLastTarget}",
            "problemMatcher": [
                "$gcc"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "presentation": {
                "clear": true
            }
        }
    ],
    "inputs": [
        {
            "id": "zigTarget",
            "type": "command",
            "command": "zig.build.getTargets",
        },
        {
            "id": "zigLastTarget",
            "type": "command",
            "command": "zig.build.getLastTargetOrPrompt"
        }
    ]
}
```

The key is to use the commands exposed by the extension as input for your own tasks.
- `zig.build.getTargets`: parses your build targets and provides a selection list to choose the one to execute `zig build TARGET`
- `zig.build.getLastTargetOrPrompt`: if a previous target was used this skips parsing the build targets and just runs it, else it is that same as `zig.build.getTargets`

Note that `zig` must be in your `PATH`!


## Multi-Command Macros
These settings allow you to create command sequence as one command and bind a key to run them or use the command palette (via the "Multi command: Execute multi command" entry). Commands are defined in your `settings.json` file in the `zig.multiCommand.commands` array.

See the [documentation](MULTI_COMMAND.md) for details on use.
