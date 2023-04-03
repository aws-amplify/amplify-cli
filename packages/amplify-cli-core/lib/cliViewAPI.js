"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewResourceTableParams = void 0;
const chalk_1 = __importDefault(require("chalk"));
class ViewResourceTableParams {
    get command() {
        return this._command;
    }
    get verbose() {
        return this._verbose;
    }
    get help() {
        return this._help;
    }
    get categoryList() {
        return this._categoryList;
    }
    getCategoryFromCLIOptions(cliOptions) {
        if (cliOptions) {
            return Object.keys(cliOptions)
                .filter((key) => key !== 'verbose' && key !== 'yes' && key !== 'debug')
                .map((category) => category.toLowerCase());
        }
        else {
            return [];
        }
    }
    styleHeader(str) {
        return chalk_1.default.italic(chalk_1.default.bgGray.whiteBright(str));
    }
    styleCommand(str) {
        return chalk_1.default.greenBright(str);
    }
    styleOption(str) {
        return chalk_1.default.yellowBright(str);
    }
    stylePrompt(str) {
        return chalk_1.default.bold(chalk_1.default.yellowBright(str));
    }
    getStyledHelp() {
        return `
${this.styleHeader('NAME')}
${this.styleCommand('amplify status')} --  Shows the state of local resources not yet pushed to the cloud (Create/Update/Delete)

${this.styleHeader('SYNOPSIS')}
${this.styleCommand('amplify status')} [${this.styleCommand('-v')}|${this.styleCommand('--verbose')}] [${this.styleOption('category ...')}]

${this.styleHeader('DESCRIPTION')}
The amplify status command displays the difference between the deployed state and the local state of the application.
The following options are available:

${this.styleCommand('[category ...]')}    : (Summary mode) Displays the summary of local state vs deployed state of the application
                    usage:
                    ${this.stylePrompt('#>')} ${this.styleCommand('amplify status')}
                    ${this.stylePrompt('#>')} ${this.styleCommand('amplify status')} ${this.styleOption('api storage')}

${this.styleCommand('-v [category ...]')} : (Verbose mode) Displays the cloudformation diff for all resources for the specified category.
                    If no category is provided, it shows the diff for all categories.
                    usage:
                    ${this.stylePrompt('#>')} ${this.styleCommand('amplify status -v')}
                    ${this.stylePrompt('#>')} ${this.styleCommand('amplify status -v ')}${this.styleOption('api storage')}

    `;
    }
    logErrorException(e, context) {
        context.print.error(`Name: ${e.name} : Message: ${e.message}`);
    }
    constructor(cliParams) {
        var _a;
        this._command = cliParams.cliCommand;
        this._verbose = ((_a = cliParams.cliOptions) === null || _a === void 0 ? void 0 : _a.verbose) === true;
        this._categoryList = this.getCategoryFromCLIOptions(cliParams.cliOptions);
        this._filteredResourceList = [];
        this._help = cliParams.cliSubcommands ? cliParams.cliSubcommands.includes('help') : false;
    }
}
exports.ViewResourceTableParams = ViewResourceTableParams;
//# sourceMappingURL=cliViewAPI.js.map