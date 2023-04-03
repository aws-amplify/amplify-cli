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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = exports.table = exports.debug = exports.fancy = exports.blue = exports.red = exports.yellow = exports.green = exports.success = exports.error = exports.warning = exports.info = exports.attachPrint = exports.attachExtensions = void 0;
const cli_table3_1 = __importDefault(require("cli-table3"));
const safe_1 = __importDefault(require("colors/safe"));
const ejs_1 = __importDefault(require("ejs"));
const fs = __importStar(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const path = __importStar(require("path"));
safe_1.default.setTheme({
    highlight: 'cyan',
    info: 'reset',
    warning: 'yellow',
    success: 'green',
    error: 'red',
    line: 'grey',
    muted: 'grey',
    green: 'green',
    yellow: 'yellow',
    red: 'red',
    blue: 'blue',
});
const colors = safe_1.default;
function attachExtensions(context) {
    attachFilesystem(context);
    attachPrint(context);
    attachParameters(context);
    attachRuntime(context);
    attachPrompt(context);
    attachTemplate(context);
}
exports.attachExtensions = attachExtensions;
function attachPrompt(context) {
    context.prompt = {
        confirm: async (message, defaultValue = false) => {
            const { yesno } = await inquirer_1.default.prompt({
                name: 'yesno',
                type: 'confirm',
                message,
                default: defaultValue,
            });
            return yesno;
        },
        ask: async (questions) => {
            if (Array.isArray(questions)) {
                questions = questions.map((q) => {
                    if (q.type === 'rawlist' || q.type === 'list') {
                        q.type = 'select';
                    }
                    if (q.type === 'expand') {
                        q.type = 'autocomplete';
                    }
                    if (q.type === 'checkbox') {
                        q.type = 'multiselect';
                    }
                    if (q.type === 'radio') {
                        q.type = 'select';
                    }
                    if (q.type === 'question') {
                        q.type = 'input';
                    }
                    return q;
                });
            }
            return inquirer_1.default.prompt(questions);
        },
    };
}
function attachParameters(context) {
    const { argv, plugin, command, subCommands, options } = context.input;
    context.parameters = {
        argv,
        plugin,
        command,
        options: options !== null && options !== void 0 ? options : {},
        raw: argv,
        array: subCommands,
    };
    if (subCommands && subCommands.length > 0) {
        if (subCommands.length > 0) {
            context.parameters.first = subCommands[0];
        }
        if (subCommands.length > 1) {
            context.parameters.second = subCommands[1];
        }
        if (subCommands.length > 2) {
            context.parameters.third = subCommands[2];
        }
    }
}
function attachRuntime(context) {
    context.runtime = {
        plugins: [],
    };
    Object.keys(context.pluginPlatform.plugins).forEach((pluginShortName) => {
        const pluginInformation = context.pluginPlatform.plugins[pluginShortName];
        pluginInformation.forEach((pluginEntry) => {
            var _a;
            const name = path.basename(pluginEntry.packageLocation);
            const directory = pluginEntry.packageLocation;
            const pluginName = pluginEntry.manifest.name;
            const pluginType = pluginEntry.manifest.type;
            const commands = (_a = pluginEntry.manifest.commands) !== null && _a !== void 0 ? _a : [];
            context.runtime.plugins.push({
                name,
                directory,
                pluginName,
                pluginType,
                commands,
            });
        });
    });
}
function attachFilesystem(context) {
    context.filesystem = contextFileSystem;
}
const contextFileSystem = {
    remove: (targetPath) => {
        fs.removeSync(targetPath);
    },
    read: (targetPath, encoding = 'utf8') => {
        const result = fs.readFileSync(targetPath, { encoding });
        return result;
    },
    write: (targetPath, data) => {
        fs.ensureFileSync(targetPath);
        fs.writeFileSync(targetPath, data, 'utf-8');
    },
    exists: (targetPath) => {
        const result = fs.existsSync(targetPath);
        return result;
    },
    isFile: (targetPath) => {
        const result = fs.statSync(targetPath).isFile();
        return result;
    },
    path: (...pathParts) => {
        const result = path.normalize(path.join(...pathParts));
        return result;
    },
};
function attachPrint(context) {
    context.print = exports.print;
}
exports.attachPrint = attachPrint;
function info(message) {
    console.log(colors.info(message));
}
exports.info = info;
function warning(message) {
    console.log(colors.warning(message));
}
exports.warning = warning;
function error(message) {
    console.log(colors.error(message));
}
exports.error = error;
function success(message) {
    console.log(colors.success(message));
}
exports.success = success;
function green(message) {
    console.log(colors.green(message));
}
exports.green = green;
function yellow(message) {
    console.log(colors.yellow(message));
}
exports.yellow = yellow;
function red(message) {
    console.log(colors.red(message));
}
exports.red = red;
function blue(message) {
    console.log(colors.blue(message));
}
exports.blue = blue;
function fancy(message) {
    console.log(message);
}
exports.fancy = fancy;
function debug(message, title = 'DEBUG') {
    const topLine = `vvv -----[ ${title} ]----- vvv`;
    const botLine = `^^^ -----[ ${title} ]----- ^^^`;
    console.log(colors.rainbow(topLine));
    console.log(message);
    console.log(colors.rainbow(botLine));
}
exports.debug = debug;
function table(data, options = {}) {
    let t;
    switch (options.format) {
        case 'markdown': {
            const header = data.shift();
            t = new cli_table3_1.default({
                style: { head: ['reset'] },
                head: header,
                chars: CLI_TABLE_MARKDOWN,
            });
            t.push(...data);
            t.unshift(columnHeaderDivider(t));
            break;
        }
        case 'lean':
            t = new cli_table3_1.default({
                style: { head: ['reset'] },
            });
            t.push(...data);
            break;
        default:
            t = new cli_table3_1.default({
                style: { head: ['reset'] },
                chars: CLI_TABLE_COMPACT,
            });
            t.push(...data);
    }
    console.log(t.toString());
}
exports.table = table;
exports.print = {
    info,
    fancy,
    warning,
    error,
    success,
    table,
    debug,
    green,
    yellow,
    red,
    blue,
};
function columnHeaderDivider(cliTable) {
    return findWidths(cliTable).map((w) => Array(w).join('-'));
}
function findWidths(cliTable) {
    return [cliTable.options.head]
        .concat(getRows(cliTable))
        .reduce((colWidths, row) => row.map((str, i) => Math.max(`${str}`.length + 1, colWidths[i] || 1)), []);
}
function getRows(cliTable) {
    const list = new Array(cliTable.length);
    for (let i = 0; i < cliTable.length; i++) {
        list[i] = cliTable[i];
    }
    return list;
}
const CLI_TABLE_COMPACT = {
    top: '',
    'top-mid': '',
    'top-left': '',
    'top-right': '',
    bottom: '',
    'bottom-mid': '',
    'bottom-left': '',
    'bottom-right': '',
    left: ' ',
    'left-mid': '',
    mid: '',
    'mid-mid': '',
    right: '',
    'right-mid': '',
    middle: ' ',
};
const CLI_TABLE_MARKDOWN = {
    ...CLI_TABLE_COMPACT,
    left: '|',
    right: '|',
    middle: '|',
};
function attachTemplate(context) {
    context.template = {
        async generate(opts) {
            const template = opts.template;
            const target = opts.target;
            const props = opts.props || {};
            const data = {
                props,
            };
            const pathToTemplate = opts.directory ? path.join(opts.directory, template) : template;
            if (!contextFileSystem.isFile(pathToTemplate)) {
                throw new Error(`template not found ${pathToTemplate}`);
            }
            const templateContent = contextFileSystem.read(pathToTemplate);
            const content = ejs_1.default.render(templateContent, data);
            if (target.length > 0) {
                const dir = target.replace(/$(\/)*/g, '');
                const dest = contextFileSystem.path(dir);
                contextFileSystem.write(dest, content);
            }
            return content;
        },
    };
}
//# sourceMappingURL=context-extensions.js.map