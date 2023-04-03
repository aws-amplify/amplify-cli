"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewireDeprecatedCommands = void 0;
const rewiredCommands = {
    'function.invoke': {
        warningMsg: '"amplify function invoke <function name>" is deprecated and will be removed in a future version.\nUse "amplify mock function <function name>" instead.',
        plugin: 'mock',
        command: 'function',
    },
};
function rewireDeprecatedCommands(input) {
    const newCommand = rewiredCommands[input.plugin + '.' + input.command];
    if (newCommand) {
        input.plugin = newCommand.plugin;
        input.command = newCommand.command;
        console.warn(newCommand.warningMsg);
    }
}
exports.rewireDeprecatedCommands = rewireDeprecatedCommands;
//# sourceMappingURL=rewireDeprecatedCommands.js.map