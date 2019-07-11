import Context from './domain/context';
import fs from 'fs-extra';
import path from 'path';
import importedColors from 'colors/safe';
import CLITable from 'cli-table3';

importedColors.setTheme({
    highlight: 'cyan',
    info: 'reset',
    warning: 'yellow',
    success: 'green',
    error: 'red',
    line: 'grey',
    muted: 'grey',
})

type GluegunPrintColors = typeof importedColors & {
    highlight: (t: string) => string
    info: (t: string) => string
    warning: (t: string) => string
    success: (t: string) => string
    error: (t: string) => string
    line: (t: string) => string
    muted: (t: string) => string
}

const colors = importedColors as GluegunPrintColors;

export function attachGluegunExtentions(context: Context) {
    attachFilesystem(context);
    attachPrint(context);
    attachParameters(context);
    attachPatching(context);
    attachRuntime(context);
    attachPrompt(context);
    attachTemplate(context);
}

function attachPrompt(context: Context) {
    const inquirer = require('inquirer');
    context.prompt = {
        confirm: async (message: string): Promise<boolean> => {
            const { yesno } = await inquirer.prompt({
              name: 'yesno',
              type: 'confirm',
              message,
            })
            return yesno;
        },
        ask: async (questions: any) => {
            if (Array.isArray(questions)) {
                questions = questions.map(q => {
                    if (q.type === 'rawlist' || q.type === 'list') { q.type = 'select' }
                    if (q.type === 'expand') { q.type = 'autocomplete' }
                    if (q.type === 'checkbox') { q.type = 'multiselect' }
                    if (q.type === 'radio') { q.type = 'select' }
                    if (q.type === 'question') { q.type = 'input' }
                    return q
                })
            }
            return inquirer.prompt(questions)
        }
    }
}

function attachParameters(context: Context) {
    const {
        argv,
        plugin,
        command,
        subCommands,
        options,
    } = context.input;

    context.parameters = {
        argv,
        plugin,
        command,
        options,
    };
    context.parameters.options = context.parameters.options || {};
    context.parameters.raw = argv;
    context.parameters.array = subCommands;
    if (subCommands && subCommands.length > 1) {
        if (subCommands.length > 0) {
            context.parameters.first = (<Array<string>>subCommands)[0];
        }
        if (subCommands.length > 1) {
            context.parameters.second = (<Array<string>>subCommands)[1];
        }
        if (subCommands.length > 2) {
            context.parameters.third = (<Array<string>>subCommands)[2];
        }
    }
}

function attachRuntime(context: Context) {
    context.runtime = {
        plugins: []
    };
    Object.keys(context.pluginPlatform.plugins).forEach((pluginShortName) => {
        const pluginInfos = context.pluginPlatform.plugins[pluginShortName];
        pluginInfos.forEach((pluginInfo) => {
            const name = path.basename(pluginInfo.packageLocation);
            const directory = pluginInfo.packageLocation;
            const commands = pluginInfo.manifest.commands;
            context.runtime.plugins.push({
                name,
                directory,
                commands
            })
        })
    })
}

function attachFilesystem(context: Context) {
    context.filesystem = contextFileSystem;
}

const contextFileSystem = {
    remove: (targetPath: string): void => {
        fs.removeSync(targetPath);
    },
    read: (targetPath: string, encoding: string = 'utf8'): any => {
        return fs.readFileSync(targetPath, encoding);
    },
    write: (targetPath: string, data: any): void => {
        fs.ensureFileSync(targetPath);
        fs.writeFileSync(targetPath, data, 'utf-8');
    },
    exists: (targetPath: string): boolean => {
        return fs.existsSync(targetPath);
    },
    isFile: (targetPath: string): boolean => {
        return fs.statSync(targetPath).isFile();
    },
    path: (...pathParts: string[]): string => {
        return path.normalize(path.join(...pathParts));
    }
}

function attachPatching(context: Context) {
    context.patching = {
        replace: async (filePath: string, oldContent: string, newContent: string):
        Promise<string> => {
            let fileContent = fs.readFileSync(filePath, 'utf-8');
            let updatedFileContent = fileContent.replace(oldContent, newContent);
            fs.writeFileSync(filePath, updatedFileContent, 'utf-8');
            return Promise.resolve(updatedFileContent);
        }
    }
}

function attachPrint(context: Context) {
    context.print = {
        info,
        warning,
        error,
        success,
        table,
        debug,
    };
}

function info(message: string): void {
    console.log(colors.info(message))
}

function warning(message: string): void {
    console.log(colors.warning(message))
}

function error(message: string): void {
    console.log(colors.error(message))
}

function success(message: string): void {
    console.log(colors.success(message))
}

function debug(message: string, title: string = 'DEBUG'): void {
    const topLine = `vvv -----[ ${title} ]----- vvv`
    const botLine = `^^^ -----[ ${title} ]----- ^^^`

    console.log(colors.rainbow(topLine))
    console.log(message)
    console.log(colors.rainbow(botLine))
}

function table(data: string[][], options: any = {}): void {
    let t
    switch (options.format) {
      case 'markdown':
        const header = data.shift()
        t = new CLITable({
          head: header,
          chars: CLI_TABLE_MARKDOWN,
        }) as CLITable.HorizontalTable;
        t.push(...data);
        t.unshift(columnHeaderDivider(t));
        break
      case 'lean':
        t = new CLITable() as CLITable.HorizontalTable;
        t.push(...data);
        break
      default:
        t = new CLITable({
          chars: CLI_TABLE_COMPACT,
        }) as CLITable.HorizontalTable;
        t.push(...data)
    }
    console.log(t.toString())
}

function columnHeaderDivider(cliTable: CLITable.Table): string[] {
    return findWidths(cliTable).map(w => Array(w).join('-'))
}

function findWidths(cliTable: CLITable.Table): number[] {
    return [(cliTable as any).options.head]
      .concat(getRows(cliTable))
      .reduce((colWidths, row) => row.map(
          (str: string, i: number) => Math.max(`${str}`.length + 1, colWidths[i] || 1)
        ), []);
}

function getRows(cliTable: CLITable.Table) {
    let list = new Array(cliTable.length);
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
}

const CLI_TABLE_MARKDOWN = {
    ...CLI_TABLE_COMPACT,
    left: '|',
    right: '|',
    middle: '|',
}

/////////////////template tool////////////////////////

function attachTemplate(context: Context) {
    context.template = {
        generate: async function (opts: any): Promise<string> {
            const ejs = require('ejs');
            const template = opts.template
            const target = opts.target
            const props = opts.props || {}
            const data = {
              props,
            }
            const directory = opts.directory;
            const pathToTemplate = `${directory}/${template}`

            if (!contextFileSystem.isFile(pathToTemplate)) {
              throw new Error(`template not found ${pathToTemplate}`)
            }

            const templateContent = contextFileSystem.read(pathToTemplate);

            const content = ejs.render(templateContent, data)

            if (target.length > 0) {
              const dir = target.replace(/$(\/)*/g, '')
              const dest = contextFileSystem.path(dir)
              contextFileSystem.write(dest, content)
            }

            return content
        },
    }
}