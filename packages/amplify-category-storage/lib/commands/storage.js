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
exports.run = exports.name = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const path = __importStar(require("path"));
const constants_1 = require("../constants");
var constants_2 = require("../constants");
Object.defineProperty(exports, "name", { enumerable: true, get: function () { return constants_2.categoryName; } });
const help_1 = require("./storage/help");
async function run(context) {
    var _a;
    if ((_a = context.parameters.options) === null || _a === void 0 ? void 0 : _a.help) {
        (0, help_1.run)(context);
        return;
    }
    if (/^win/.test(process.platform)) {
        try {
            if (!context.parameters.first) {
                throw new TypeError('Missing command');
            }
            const { run } = await (_a = path.join('.', constants_1.categoryName, context.parameters.first), Promise.resolve().then(() => __importStar(require(_a))));
            run(context);
        }
        catch (e) {
            amplify_prompts_1.printer.error('Command not found');
        }
    }
}
exports.run = run;
//# sourceMappingURL=storage.js.map