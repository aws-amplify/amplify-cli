"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAmplifyEvent = exports.executeAmplifyCommand = void 0;
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
async function executeAmplifyCommand(context) {
    let commandPath = path_1.default.normalize(path_1.default.join(__dirname, 'commands'));
    if (context.input.command === 'help') {
        commandPath = path_1.default.join(commandPath, constants_1.category);
    }
    else {
        commandPath = path_1.default.join(commandPath, constants_1.category, context.input.command);
    }
    const commandModule = require(commandPath);
    await commandModule.run(context);
}
exports.executeAmplifyCommand = executeAmplifyCommand;
async function handleAmplifyEvent(context, args) {
    context.print.info(`${constants_1.category} handleAmplifyEvent to be implemented`);
    context.print.info(`Received event args ${args}`);
}
exports.handleAmplifyEvent = handleAmplifyEvent;
//# sourceMappingURL=index.js.map