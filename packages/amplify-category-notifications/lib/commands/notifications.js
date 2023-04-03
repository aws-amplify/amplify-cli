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
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.alias = exports.name = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const help_1 = require("./notifications/help");
exports.name = 'notifications';
exports.alias = ['notification'];
const run = async (context) => {
    var _a;
    var _b;
    if ((_b = context.parameters.options) === null || _b === void 0 ? void 0 : _b.help) {
        return (0, help_1.run)(context);
    }
    if (/^win/.test(process.platform)) {
        try {
            const notificationsFlow = await (_a = `./${exports.name}/${context.parameters.first}`, Promise.resolve().then(() => __importStar(require(_a))));
            return notificationsFlow.run(context);
        }
        catch (e) {
            amplify_prompts_1.printer.error('Command not found');
        }
    }
    return undefined;
};
exports.run = run;
//# sourceMappingURL=notifications.js.map