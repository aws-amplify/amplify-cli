"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAmplifyEvent = exports.executeAmplifyCommand = void 0;
const path_1 = __importDefault(require("path"));
const executeAmplifyCommand = async (context, cmd) => {
    const commandsDirPath = path_1.default.normalize(path_1.default.join(__dirname, 'commands'));
    const commandPath = path_1.default.join(commandsDirPath, cmd || context.input.command);
    const commandModule = require(commandPath);
    await commandModule.run(context);
};
exports.executeAmplifyCommand = executeAmplifyCommand;
const handleAmplifyEvent = async (context, { event }) => {
    const eventHandlersDirPath = path_1.default.normalize(path_1.default.join(__dirname, 'event-handlers'));
    const eventHandlerPath = path_1.default.join(eventHandlersDirPath, `handle-${event}`);
    const eventHandlerModule = require(eventHandlerPath);
    await eventHandlerModule.run(context);
};
exports.handleAmplifyEvent = handleAmplifyEvent;
//# sourceMappingURL=index.js.map