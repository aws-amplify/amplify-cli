"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAmplifyEvent = exports.executeAmplifyCommand = void 0;
const path = __importStar(require("path"));
const pluginName = 'mock';
async function executeAmplifyCommand(context) {
    const commandPath = path.normalize(path.join(__dirname, 'commands', pluginName, context.input.command));
    const commandModule = await (_a = commandPath, Promise.resolve().then(() => __importStar(require(_a))));
    await commandModule.run(context);
}
exports.executeAmplifyCommand = executeAmplifyCommand;
async function handleAmplifyEvent(context, args) {
    context.print.info(`${pluginName} handleAmplifyEvent to be implemented`);
    context.print.info(`Received event args ${args}`);
}
exports.handleAmplifyEvent = handleAmplifyEvent;
//# sourceMappingURL=amplify-plugin-index.js.map