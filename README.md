# vscode-build-zig

![CI](https://img.shields.io/github/workflow/status/ziglang/vscode-zig/CI.svg)

[Zig](http://ziglang.org/) build support for Visual Studio Code.

![](./images/example.png)

## Features

 - provides a parser for finding `zig build` targets

## Usage

### Direct Builds

- `cmd/ctrl+shift+r` runs the `zig.build-last-target` command which will prompt you for a target the first time it is run and run it directly thereafter
- `cmd/ctrl+shift+alt+r` runs the `zig.build-target` command which will always prompt you for a target
- you can also can wire those commands up to whatever keybindings you want or use the command palette to run them

### Using tasks.json

Open your `tasks.json` file and create two new build tasks (the second is optional):

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

The key is to use the commands exposed by the extension.
- `zig.build.getTargets`: parses your build targets and provides a selection list to choose the one to execute `zig build TARGET`
- `zig.build.getLastTargetOrPrompt`: if a previous target was used this skips parsing the build targets and just runs it, else it is that same as `zig.build.getTargets`


## Creating .vsix extension file

```
npm install
tsc src/extensions.ts
npx vsce package
```
