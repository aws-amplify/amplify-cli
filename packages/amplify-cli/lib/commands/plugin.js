"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.run = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("amplify-cli-core");
const run = async (context) => {
    let subCommand = 'help';
    if (context.input.subCommands && context.input.subCommands.length > 0) {
        subCommand = context.input.subCommands[0];
    }
    subCommand = mapSubcommandAlias(subCommand);
    const subCommandPath = path.normalize(path.join(__dirname, 'plugin', subCommand));
    Promise.resolve().then(() => __importStar(require(subCommandPath))).then(async (subCommandModule) => {
        await subCommandModule.run(context);
    })
        .catch((err) => {
        context.print.error(`Error executing command amplify plugin ${subCommand}`);
        context.print.error(err.message || err.stack || amplify_cli_core_1.JSONUtilities.stringify(err));
        void context.usageData.emitError(err);
        (0, amplify_cli_core_1.exitOnNextTick)(1);
    });
};
exports.run = run;
function mapSubcommandAlias(subcommand) {
    if (subcommand === 'init') {
        return 'new';
    }
    return subcommand;
}
//# sourceMappingURL=plugin.js.map