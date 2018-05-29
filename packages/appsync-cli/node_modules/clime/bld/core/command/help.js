"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const FS = require("fs");
const Path = require("path");
const Chalk = require("chalk");
const v = require("villa");
const cli_1 = require("../cli");
const internal_util_1 = require("../../internal-util");
class HelpInfo {
    constructor() {
        this.texts = [];
    }
    get text() {
        return this.texts.join('\n');
    }
    buildTextForSubCommands(contexts) {
        return __awaiter(this, void 0, void 0, function* () {
            let labels = [];
            let labelToHelpItemsMap = new Map();
            let helpItemMap = new Map();
            for (let [groupIndex, { label, dir }] of contexts.entries()) {
                let helpItems;
                if (labelToHelpItemsMap.has(label)) {
                    helpItems = labelToHelpItemsMap.get(label);
                }
                else {
                    helpItems = [];
                    labelToHelpItemsMap.set(label, helpItems);
                    labels.push(label);
                }
                let definitions = yield cli_1.CLI.getSubcommandDefinitions(dir);
                for (let definition of definitions) {
                    let { name, brief } = definition;
                    let aliases = definition.aliases || definition.alias && [definition.alias] || [];
                    let item;
                    let existingItem = helpItemMap.get(name);
                    if (existingItem) {
                        existingItem.overridden = true;
                        item = {
                            name,
                            brief: brief || existingItem.brief,
                            aliases: existingItem.aliases.concat(aliases),
                            group: groupIndex,
                        };
                    }
                    else {
                        item = {
                            name,
                            brief,
                            aliases,
                            group: groupIndex,
                        };
                    }
                    helpItems.push(item);
                    helpItemMap.set(name, item);
                }
                if (!(yield internal_util_1.existsDir(dir))) {
                    continue;
                }
                let names = yield v.call(FS.readdir, dir);
                for (let name of names) {
                    let path = Path.join(dir, name);
                    let stats = yield internal_util_1.safeStat(path);
                    if (stats.isFile()) {
                        if (name === 'default.js' || Path.extname(path) !== '.js') {
                            continue;
                        }
                        name = Path.basename(name, '.js');
                    }
                    else {
                        path = Path.join(path, 'default.js');
                        stats = yield internal_util_1.safeStat(path);
                    }
                    let existingItem = helpItemMap.get(name);
                    // `brief` already set in `subcommands` field
                    if (existingItem && existingItem.group === groupIndex && existingItem.brief) {
                        continue;
                    }
                    let commandConstructor;
                    let brief;
                    if (stats) {
                        let module = require(path);
                        commandConstructor = module.default;
                        brief = commandConstructor && (commandConstructor.brief || commandConstructor.description);
                    }
                    if (existingItem && existingItem.group === groupIndex) {
                        existingItem.brief = brief;
                    }
                    else {
                        let aliases;
                        if (existingItem) {
                            if (!commandConstructor) {
                                // Directory without an entry should not override existing one.
                                continue;
                            }
                            existingItem.overridden = true;
                            if (!brief) {
                                brief = existingItem.brief;
                            }
                            aliases = existingItem.aliases;
                        }
                        else {
                            aliases = [];
                        }
                        let item = {
                            name,
                            aliases,
                            brief,
                            group: groupIndex,
                        };
                        helpItems.push(item);
                        helpItemMap.set(name, item);
                    }
                }
            }
            for (let label of labels) {
                let hasAliases = false;
                let rows = labelToHelpItemsMap
                    .get(label)
                    .filter(item => {
                    if (item.overridden) {
                        return false;
                    }
                    if (!hasAliases && item.aliases.length) {
                        hasAliases = true;
                    }
                    return true;
                })
                    .map(({ name, aliases, brief }) => {
                    if (hasAliases) {
                        return [
                            Chalk.bold(name),
                            aliases.length ? `[${Chalk.dim(aliases.join(','))}]` : '',
                            brief,
                        ];
                    }
                    else {
                        return [
                            Chalk.bold(name),
                            brief,
                        ];
                    }
                });
                let separators = hasAliases ? [' ', ' - '] : ' - ';
                if (rows.length) {
                    this.texts.push(`\
  ${Chalk.green(label.toUpperCase())}\n
${internal_util_1.buildTableOutput(rows, { indent: 4, separators })}`);
                }
            }
        });
    }
    print(stdout, stderr) {
        stderr.write(`\n${this.text}\n`);
    }
    buildDescription(description) {
        if (description) {
            this.texts.push(`${internal_util_1.indent(description, 2)}\n`);
        }
    }
    buildSubcommandsUsage(sequence) {
        if (sequence && sequence.length) {
            this.texts.push(`\
  ${Chalk.green('USAGE')}\n
    ${Chalk.bold(sequence.join(' '))} <subcommand>\n`);
        }
    }
    buildTextsForParamsAndOptions(TargetCommand) {
        let paramDefinitions = TargetCommand.paramDefinitions;
        let paramsDefinition = TargetCommand.paramsDefinition;
        let parameterDescriptionRows = [];
        let parameterUsageTexts = [];
        if (paramDefinitions) {
            parameterUsageTexts = paramDefinitions.map(definition => {
                let { name, required, description, default: defaultValue, } = definition;
                if (description) {
                    parameterDescriptionRows.push([
                        Chalk.bold(name),
                        description,
                    ]);
                }
                return required ?
                    `<${name}>` :
                    `[${name}${defaultValue !== undefined ? `=${defaultValue}` : ''}]`;
            });
        }
        else {
            parameterUsageTexts = [];
        }
        if (paramsDefinition) {
            let { name, required, description, } = paramsDefinition;
            if (description) {
                parameterDescriptionRows.push([
                    Chalk.bold(name),
                    description,
                ]);
            }
            parameterUsageTexts.push(required ?
                `<...${name}>` :
                `[...${name}]`);
        }
        let optionDefinitions = TargetCommand.optionDefinitions || [];
        let requiredOptionUsageItems = optionDefinitions
            .filter(definition => definition.required)
            .map(({ name, key, placeholder }) => `--${name} <${placeholder || key}>`);
        let usageLine = [
            Chalk.bold(TargetCommand.sequence.join(' ').replace(/^\/ /, '/')),
            ...parameterUsageTexts,
            ...requiredOptionUsageItems,
        ].join(' ');
        if (optionDefinitions.length > requiredOptionUsageItems.length) {
            usageLine += ' [...options]';
        }
        this.texts.push(`\
  ${Chalk.green('USAGE')}\n
    ${usageLine}\n`);
        if (parameterDescriptionRows.length) {
            this.texts.push(`\
  ${Chalk.green('PARAMETERS')}\n
${internal_util_1.buildTableOutput(parameterDescriptionRows, { indent: 4, separators: ' - ' })}`);
        }
        if (optionDefinitions.length) {
            let optionRows = optionDefinitions
                .map(definition => {
                let { name, key, flag, placeholder, toggle: isToggle, description, } = definition;
                let triggerStr = flag ? `-${flag}, ` : '';
                triggerStr += `--${name}`;
                if (!isToggle) {
                    triggerStr += ` <${placeholder || key}>`;
                }
                return [
                    Chalk.bold(triggerStr),
                    description,
                ];
            });
            this.texts.push(`\
  ${Chalk.green('OPTIONS')}\n
${internal_util_1.buildTableOutput(optionRows, { indent: 4, separators: ' - ' })}`);
        }
    }
    /** @internal */
    static build(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let info = new HelpInfo();
            if (typeof options === 'object') {
                info.buildDescription(options.description);
                info.buildSubcommandsUsage(options.sequence);
                yield info.buildTextForSubCommands(options.contexts);
            }
            else {
                info.buildDescription(options.description);
                info.buildTextsForParamsAndOptions(options);
                yield info.buildTextForSubCommands(options.helpBuildingContexts);
            }
            return info;
        });
    }
}
exports.HelpInfo = HelpInfo;
//# sourceMappingURL=help.js.map