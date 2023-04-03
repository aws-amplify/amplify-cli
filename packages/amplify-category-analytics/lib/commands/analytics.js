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
exports.run = exports.name = exports.analyticsPush = void 0;
const help_1 = require("./analytics/help");
var push_1 = require("./analytics/push");
Object.defineProperty(exports, "analyticsPush", { enumerable: true, get: function () { return push_1.run; } });
exports.name = 'analytics';
const run = async (context) => {
    var _a;
    var _b;
    if ((_b = context.parameters.options) === null || _b === void 0 ? void 0 : _b.help) {
        return (0, help_1.run)(context);
    }
    if (/^win/.test(process.platform)) {
        const { run: runCommand } = await (_a = `./${exports.name}/${context.parameters.first}`, Promise.resolve().then(() => __importStar(require(_a))));
        return runCommand(context);
    }
    return context;
};
exports.run = run;
//# sourceMappingURL=analytics.js.map