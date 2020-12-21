# Multi Command Macros

For example:
```json
"zig.multiCommand.commands": [
    {
        "command": "multiCommand.down3Lines",
        "label": "down3Lines",
        "description": "down the cursor in 3 times",
        "sequence": [
            "cursorDown",
            "cursorDown",
            "cursorDown"
        ]
    },
    {
        "command": "multiCommand.swapChar",
        "interval": 30,
        "sequence": [
            "cursorLeftSelect",
            "editor.action.clipboardCutAction",
            "cursorRight",
            "editor.action.clipboardPasteAction"
        ]
    }
]
```

Bind a key to created command sequence in `keybindings.json`.
For example:
```json
{
    "key": "F1",
    "command": "zig.multiCommand.execute",
    "args": { "command": "multiCommand.down3Lines" },
    "when": "editorTextFocus"
},
{
    "key": "F2",
    "command": "zig.multiCommand.execute",
    "args": { "command": "multiCommand.swapChar" },
    "when": "editorTextFocus"
}
```

You can bind a key to the command you defined directly.
For example:
```json
{ "key": "F1", "command": "multiCommand.down3Lines", "when": "editorTextFocus" },
{ "key": "F2", "command": "multiCommand.swapChar", "when": "editorTextFocus" }
```

And finally, you can simultaneously create and bind a command in your `keybindings.json`. These commands will not show up in the command palatte and can only be executed via the keyboard shortcut.
For example:
```json
{
    "key": "F1",
    "command": "zig.multiCommand.executeCommandList",
    "args": {
        "sequence": [
            "cursorDown",
            "cursorDown",
            "cursorDown"
        ]
    },
    "when": "editorTextFocus"
}
```

### Advanced Settings

#### Pass arguments to commands

You can pass arguments to commands by defining a command sequence with `args` parameter.
For Example:

```json
{
    "command": "multiCommand.cutAndType",
    "sequence": [
       "editor.action.clipboardCutAction",
       {"command": "type", "args": {"text": "CUT !!"}}
    ]
}
```

This sequence cut selected text and type "CUT !!".


### Find the name of the command you want to execute

1. Execute "Developer: Set Log Level..." and select "trace" in the command palette.
2. Execute command of you want to know the name.
3. You can see the name in output panel for Log(Window) process(you can set the process for output in the rightside of the output panel).