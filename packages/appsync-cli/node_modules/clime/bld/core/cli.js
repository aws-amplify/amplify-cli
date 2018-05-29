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
const Path = require("path");
const v = require("villa");
const command_1 = require("./command");
const object_1 = require("./object");
const error_1 = require("./error");
const internal_util_1 = require("../internal-util");
const COMMAND_NAME_REGEX = /^[\w\d]+(?:-[\w\d]+)*$/;
const HELP_OPTION_REGEX = /^(?:-[h?]|--help)$/;
/**
 * Clime command line interface.
 */
class CLI {
    constructor(
        /** Command entry name. */
        name, 
        /** Root directory of command modules. */
        roots) {
        this.name = name;
        roots = Array.isArray(roots) ? roots : [roots];
        this.roots = roots.map(root => {
            let label;
            let path;
            if (typeof root === 'string') {
                path = root;
            }
            else {
                label = root.label;
                path = root.path;
            }
            return {
                label: label || 'Subcommands',
                path: Path.resolve(path),
            };
        });
    }
    execute(argv, contextExtension, cwd) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof contextExtension === 'string') {
                cwd = contextExtension;
                contextExtension = undefined;
            }
            if (!cwd) {
                cwd = process.cwd();
            }
            let { sequence, args, path, module, searchContexts, possibleUnknownCommandName, } = yield this.preProcessArguments(argv);
            let description;
            if (module) {
                let TargetCommand = module.default;
                if (TargetCommand && TargetCommand.prototype instanceof command_1.Command) {
                    // This is a command module with an actual command.
                    if (!TargetCommand.decorated) {
                        throw new TypeError(`Command defined in module "${path}" does not seem to be initialized, \
make sure to decorate it with \`@command()\``);
                    }
                    TargetCommand.path = path;
                    TargetCommand.helpBuildingContexts = searchContexts.map(context => {
                        return {
                            label: context.label,
                            dir: context.searchBase,
                        };
                    });
                    TargetCommand.sequence = sequence;
                    let argsParser = new ArgsParser(TargetCommand);
                    let parsedArgs = yield argsParser.parse(sequence, args, cwd, contextExtension);
                    if (!parsedArgs) {
                        return yield command_1.HelpInfo.build(TargetCommand);
                    }
                    let command = new TargetCommand();
                    let { args: commandArgs, extraArgs: commandExtraArgs, options: commandOptions, context, } = parsedArgs;
                    return yield this.executeCommand(command, commandArgs, commandExtraArgs, commandOptions, context);
                }
                else {
                    // This is a command module with only description and subcommand definitions.
                    description = module.description;
                }
            }
            let helpInfo = yield command_1.HelpInfo.build({
                sequence,
                contexts: searchContexts.map(context => {
                    return {
                        label: context.label,
                        dir: context.searchBase,
                    };
                }),
                description,
            });
            if (possibleUnknownCommandName) {
                throw new UsageError(`Unknown subcommand "${possibleUnknownCommandName}"`, {
                    getHelp() {
                        return helpInfo;
                    },
                });
            }
            if (args.length && HELP_OPTION_REGEX.test(args[0])) {
                return helpInfo;
            }
            else {
                throw helpInfo;
            }
        });
    }
    preProcessSearchBase(searchBase, possibleCommandName, aliasMap) {
        return __awaiter(this, void 0, void 0, function* () {
            let definitions = yield CLI.getSubcommandDefinitions(searchBase);
            let definitionMap = new Map();
            for (let definition of definitions) {
                definitionMap.set(definition.name, definition);
                let aliases = definition.aliases || definition.alias && [definition.alias];
                if (!aliases) {
                    continue;
                }
                for (let alias of aliases) {
                    if (aliasMap.has(alias)) {
                        let targetName = aliasMap.get(alias);
                        if (targetName !== definition.name) {
                            throw new Error(`Alias "${alias}" already exists and points to "${targetName}" \
instead of "${definition.name}"`);
                        }
                        continue;
                    }
                    aliasMap.set(alias, definition.name);
                }
            }
            possibleCommandName = definitionMap.has(possibleCommandName) ?
                possibleCommandName : aliasMap.get(possibleCommandName) || possibleCommandName;
            searchBase = Path.join(searchBase, possibleCommandName);
            let entry = yield CLI.findEntryBySearchBase(searchBase);
            return {
                name: possibleCommandName,
                searchBase: internal_util_1.existsDir(searchBase) ? searchBase : undefined,
                path: entry && entry.path,
                module: entry && entry.module,
            };
        });
    }
    /**
     * Mapping the command line arguments to a specific command file.
     */
    preProcessArguments(argv) {
        return __awaiter(this, void 0, void 0, function* () {
            let sequence = [this.name];
            let possibleUnknownCommandName;
            let argsIndex = 0;
            let targetPath;
            let targetModule;
            let contexts = yield v.map(this.roots, (root) => __awaiter(this, void 0, void 0, function* () {
                let path = Path.join(root.path, 'default.js');
                path = (yield internal_util_1.existsFile(path)) ? path : undefined;
                let module;
                if (path) {
                    module = require(path);
                    if (module.default || !targetPath) {
                        targetPath = path;
                        targetModule = module;
                    }
                }
                return {
                    label: root.label,
                    name: this.name,
                    searchBase: root.path,
                    path,
                    module,
                };
            }));
            for (let i = argsIndex; i < argv.length && contexts.length; i++) {
                let possibleCommandName = argv[i];
                if (!COMMAND_NAME_REGEX.test(possibleCommandName)) {
                    break;
                }
                let aliasMap = new Map();
                let nextContexts = yield v.map(contexts, (context) => __awaiter(this, void 0, void 0, function* () {
                    let searchBaseContext = yield this.preProcessSearchBase(context.searchBase, possibleCommandName, aliasMap);
                    return Object.assign({ label: context.label }, searchBaseContext);
                }));
                let targetContexts = nextContexts.filter(context => !!context.path);
                if (!targetContexts.length) {
                    possibleUnknownCommandName = possibleCommandName;
                    break;
                }
                let targetContext = targetContexts[0];
                for (let context of targetContexts.slice(1)) {
                    let module = context.module;
                    if (module && module.default) {
                        targetContext = context;
                    }
                }
                targetPath = targetContext.path;
                targetModule = targetContext.module;
                possibleCommandName = targetContext.name;
                argsIndex = i + 1;
                sequence.push(possibleCommandName);
                contexts = nextContexts.filter(context => !!context.searchBase);
            }
            return {
                sequence,
                args: argv.slice(argsIndex),
                path: targetPath,
                module: targetModule,
                searchContexts: contexts,
                possibleUnknownCommandName,
            };
        });
    }
    executeCommand(command, commandArgs, commandExtraArgs, commandOptions, context) {
        let executeMethodArgs = commandArgs.concat();
        if (commandExtraArgs) {
            executeMethodArgs.push(commandExtraArgs);
        }
        if (commandOptions) {
            executeMethodArgs.push(commandOptions);
        }
        if (context) {
            executeMethodArgs.push(context);
        }
        return command.execute(...executeMethodArgs);
    }
    /**
     * @internal
     * Get subcommands definition written as `export subcommands = [...]`.
     */
    static getSubcommandDefinitions(searchBase) {
        return __awaiter(this, void 0, void 0, function* () {
            let entry = yield this.findEntryBySearchBase(searchBase);
            if (!entry || !entry.module) {
                return [];
            }
            return entry.module.subcommands || [];
        });
    }
    static findEntryBySearchBase(searchBase) {
        return __awaiter(this, void 0, void 0, function* () {
            let possiblePaths = [
                `${searchBase}.js`,
                Path.join(searchBase, 'default.js'),
            ];
            for (let possiblePath of possiblePaths) {
                if (yield internal_util_1.existsFile(possiblePath)) {
                    return {
                        path: possiblePath,
                        module: require(possiblePath),
                    };
                }
            }
            if (yield internal_util_1.existsDir(searchBase)) {
                return {
                    path: searchBase,
                    module: undefined,
                };
            }
            return undefined;
        });
    }
}
exports.CLI = CLI;
class ArgsParser {
    constructor(command) {
        this.helpProvider = command;
        this.paramDefinitions = command.paramDefinitions;
        this.requiredParamsNumber = command.requiredParamsNumber;
        this.paramsDefinition = command.paramsDefinition;
        this.optionsConstructor = command.optionsConstructor;
        this.optionDefinitions = command.optionDefinitions;
        this.contextConstructor = command.contextConstructor;
        if (this.optionDefinitions) {
            this.optionFlagMapping = new Map();
            this.optionDefinitionMap = new Map();
            for (let definition of this.optionDefinitions) {
                let { name, flag, } = definition;
                this.optionDefinitionMap.set(name, definition);
                if (flag) {
                    this.optionFlagMapping.set(flag, name);
                }
            }
        }
    }
    parse(sequence, args, cwd, contextExtension) {
        return __awaiter(this, void 0, void 0, function* () {
            let that = this;
            let ContextConstructor = this.contextConstructor || command_1.Context;
            let context = new ContextConstructor({
                cwd,
                commands: sequence,
            }, contextExtension);
            args = args.concat();
            let OptionConstructor = this.optionsConstructor;
            let optionDefinitions = this.optionDefinitions;
            let optionDefinitionMap = this.optionDefinitionMap || new Map();
            let optionFlagMapping = this.optionFlagMapping || new Map();
            let requiredOptionSet;
            let paramDefinitions = this.paramDefinitions || [];
            let pendingParamDefinitions = paramDefinitions.concat();
            let paramsDefinition = this.paramsDefinition;
            let argsNumber = args.length;
            let commandArgs = [];
            let commandExtraArgs = paramsDefinition && [];
            let commandOptions;
            if (OptionConstructor) {
                commandOptions = new OptionConstructor();
                requiredOptionSet = new Set();
                for (let definition of optionDefinitions) {
                    let { name, key, type, required, validators, toggle, default: defaultValue, } = definition;
                    if (required) {
                        requiredOptionSet.add(name);
                    }
                    if (toggle) {
                        commandOptions[key] = false;
                    }
                    else {
                        commandOptions[key] = typeof defaultValue === 'string' ?
                            yield castArgument(defaultValue, name, type, validators, true) :
                            defaultValue;
                    }
                }
            }
            while (args.length) {
                let arg = args.shift();
                if (arg === '-?' ||
                    (arg === '-h' && !optionFlagMapping.has('h')) ||
                    (arg === '--help' && !optionDefinitionMap.has('help'))) {
                    return undefined;
                }
                if (arg[0] === '-' && isNaN(Number(arg))) {
                    if (arg[1] === '-') {
                        yield consumeToggleOrOption(arg.substr(2));
                    }
                    else {
                        yield consumeFlags(arg.substr(1));
                    }
                }
                else if (pendingParamDefinitions.length) {
                    let definition = pendingParamDefinitions.shift();
                    let casted = yield castArgument(arg, definition.name, definition.type, definition.validators, false);
                    commandArgs.push(casted);
                }
                else if (paramsDefinition) {
                    let casted = yield castArgument(arg, paramsDefinition.name, paramsDefinition.type, paramsDefinition.validators, false);
                    commandExtraArgs.push(casted);
                }
                else {
                    throw new UsageError(`Expecting ${paramDefinitions.length} parameter(s) at most but got ${argsNumber} instead`, this.helpProvider);
                }
            }
            {
                let expecting = this.requiredParamsNumber;
                let got = commandArgs.length;
                if (got < expecting) {
                    let missingArgNames = pendingParamDefinitions
                        .slice(0, expecting - got)
                        .map(definition => `\`${definition.name}\``);
                    throw new UsageError(`Expecting parameter(s) ${missingArgNames.join(', ')}`, this.helpProvider);
                }
            }
            let missingOptionNames = requiredOptionSet && Array.from(requiredOptionSet);
            if (missingOptionNames && missingOptionNames.length) {
                throw new UsageError(`Missing required option(s) \`${missingOptionNames.join('`, `')}\``, this.helpProvider);
            }
            for (let definition of pendingParamDefinitions) {
                let defaultValue = definition.default;
                let value = typeof defaultValue === 'string' ?
                    yield castArgument(defaultValue, definition.name, definition.type, definition.validators, true) :
                    defaultValue;
                commandArgs.push(value);
            }
            if (paramsDefinition &&
                paramsDefinition.required &&
                !commandExtraArgs.length) {
                throw new UsageError(`Expecting at least one element for variadic parameters \`${paramsDefinition.name}\``, this.helpProvider);
            }
            return {
                args: commandArgs,
                extraArgs: paramsDefinition && commandExtraArgs,
                options: commandOptions,
                context: this.contextConstructor ? context : undefined,
            };
            function consumeFlags(flags) {
                return __awaiter(this, void 0, void 0, function* () {
                    for (let i = 0; i < flags.length; i++) {
                        let flag = flags[i];
                        if (!optionFlagMapping.has(flag)) {
                            throw new UsageError(`Unknown option flag "${flag}"`, that.helpProvider);
                        }
                        let name = optionFlagMapping.get(flag);
                        let definition = optionDefinitionMap.get(name);
                        if (definition.required) {
                            requiredOptionSet.delete(name);
                        }
                        if (definition.toggle) {
                            commandOptions[definition.key] = true;
                        }
                        else {
                            if (i !== flags.length - 1) {
                                throw new UsageError('Only the last flag in a sequence can refer to an option instead of a toggle', that.helpProvider);
                            }
                            yield consumeOption(definition);
                        }
                    }
                });
            }
            function consumeToggleOrOption(name) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!optionDefinitionMap.has(name)) {
                        throw new UsageError(`Unknown option \`${name}\``, that.helpProvider);
                    }
                    let definition = optionDefinitionMap.get(name);
                    if (definition.required) {
                        requiredOptionSet.delete(name);
                    }
                    if (definition.toggle) {
                        commandOptions[definition.key] = true;
                    }
                    else {
                        yield consumeOption(definition);
                    }
                });
            }
            function consumeOption(definition) {
                return __awaiter(this, void 0, void 0, function* () {
                    let { name, key, type, validators, } = definition;
                    let arg = args.shift();
                    if (arg === undefined) {
                        throw new UsageError(`Expecting value for option \`${name}\``, that.helpProvider);
                    }
                    if (arg[0] === '-' && isNaN(Number(arg))) {
                        throw new UsageError(`Expecting a value instead of an option or toggle "${arg}" for option \`${name}\``, that.helpProvider);
                    }
                    commandOptions[key] = yield castArgument(arg, name, type, validators, false);
                });
            }
            function castArgument(arg, name, type, validators, usingDefault) {
                return __awaiter(this, void 0, void 0, function* () {
                    let castingContext = object_1.buildCastingContext(context, {
                        name,
                        default: usingDefault,
                        validators,
                    });
                    return yield object_1.cast(arg, type, castingContext);
                });
            }
        });
    }
}
class UsageError extends error_1.ExpectedError {
    constructor(message, helpProvider) {
        super(message);
        this.helpProvider = helpProvider;
    }
    print(stdout, stderr) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            _super("print").call(this, stdout, stderr);
            let help = yield this.helpProvider.getHelp();
            help.print(stdout, stderr);
        });
    }
}
exports.UsageError = UsageError;
//# sourceMappingURL=cli.js.map