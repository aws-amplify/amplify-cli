import CLITable from 'cli-table3';
import importedColors from 'colors/safe';
import ejs from 'ejs';
import { $TSContext } from '../types';
import * as fs from 'fs-extra';
import inquirer from 'inquirer';
import * as path from 'path';

importedColors.setTheme({
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

type CliPrintColors = typeof importedColors & {
  highlight: (t: string) => string;
  info: (t: string) => string;
  warning: (t: string) => string;
  success: (t: string) => string;
  error: (t: string) => string;
  line: (t: string) => string;
  muted: (t: string) => string;
  green: (t: string) => string;
  yellow: (t: string) => string;
  red: (t: string) => string;
  blue: (t: string) => string;
};

const colors = importedColors as CliPrintColors;

export function attachExtensions(context: $TSContext) {
  attachFilesystem(context);
  attachPrint(context);
  attachParameters(context);
  attachRuntime(context);
  attachPrompt(context);
  attachTemplate(context);
}

function attachPrompt(context: $TSContext) {
  context.prompt = {
    confirm: async (message: string, defaultValue = false): Promise<boolean> => {
      const { yesno } = await inquirer.prompt({
        name: 'yesno',
        type: 'confirm',
        message,
        default: defaultValue,
      });
      return yesno;
    },
    ask: async (questions: any) => {
      if (Array.isArray(questions)) {
        questions = questions.map(q => {
          // eslint-disable-next-line spellcheck/spell-checker
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
      return inquirer.prompt(questions);
    },
  };
}

function attachParameters(context: $TSContext) {
  const { argv, plugin, command, subCommands, options } = context.input;

  context.parameters = {
    argv,
    plugin,
    command,
    options,
  };
  context.parameters.options = context.parameters.options || {};
  context.parameters.raw = argv;
  context.parameters.array = subCommands;
  /* tslint:disable */
  if (subCommands && subCommands.length > 0) {
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
  /* tslint:enable */
}

function attachRuntime(context: $TSContext) {
  context.runtime = {
    plugins: [],
  };
  Object.keys(context.pluginPlatform.plugins).forEach(pluginShortName => {
    const pluginInformation = context.pluginPlatform.plugins[pluginShortName];
    pluginInformation.forEach(pluginEntry => {
      const name = path.basename(pluginEntry.packageLocation);
      const directory = pluginEntry.packageLocation;
      const pluginName = pluginEntry.manifest.name;
      const pluginType = pluginEntry.manifest.type;
      const commands = pluginEntry.manifest.commands;
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

function attachFilesystem(context: $TSContext) {
  context.filesystem = contextFileSystem;
}

const contextFileSystem = {
  remove: (targetPath: string): void => {
    fs.removeSync(targetPath);
  },
  read: (targetPath: string, encoding = 'utf8'): any => {
    const result = fs.readFileSync(targetPath, encoding);
    return result;
  },
  write: (targetPath: string, data: any): void => {
    fs.ensureFileSync(targetPath);
    fs.writeFileSync(targetPath, data, 'utf-8');
  },
  exists: (targetPath: string): boolean => {
    const result = fs.existsSync(targetPath);
    return result;
  },
  isFile: (targetPath: string): boolean => {
    const result = fs.statSync(targetPath).isFile();
    return result;
  },
  path: (...pathParts: string[]): string => {
    const result = path.normalize(path.join(...pathParts));
    return result;
  },
};

export function attachPrint(context: $TSContext) {
  context.print = print;
}

export function info(message: string): void {
  console.log(colors.info(message));
}

export function warning(message: string): void {
  console.log(colors.warning(message));
}

export function error(message: string): void {
  console.log(colors.error(message));
}

export function success(message: string): void {
  console.log(colors.success(message));
}

export function green(message: string): void {
  console.log(colors.green(message));
}

export function yellow(message: string): void {
  console.log(colors.yellow(message));
}

export function red(message: string): void {
  console.log(colors.red(message));
}

export function blue(message: string): void {
  console.log(colors.blue(message));
}

export function fancy(message?: string): void {
  console.log(message);
}

export function debug(message: string, title = 'DEBUG'): void {
  const topLine = `vvv -----[ ${title} ]----- vvv`;
  const botLine = `^^^ -----[ ${title} ]----- ^^^`;

  console.log(colors.rainbow(topLine));
  console.log(message);
  console.log(colors.rainbow(botLine));
}

export function table(data: string[][], options: { format?: 'markdown' | 'lean' } = {}): void {
  let t: CLITable.Table;
  switch (options.format) {
    case 'markdown': {
      const header = data.shift();
      t = new CLITable({
        style: { head: ['reset'] }, // "no color"
        head: header,
        chars: CLI_TABLE_MARKDOWN,
      });
      t.push(...data);
      t.unshift(columnHeaderDivider(t));
      break;
    }
    case 'lean':
      t = new CLITable({
        style: { head: ['reset'] }, // "no color"
      });
      t.push(...data);
      break;
    default:
      t = new CLITable({
        style: { head: ['reset'] }, // "no color"
        chars: CLI_TABLE_COMPACT,
      });
      t.push(...data);
  }
  console.log(t.toString());
}

export const print = {
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

function columnHeaderDivider(cliTable: CLITable.Table): string[] {
  return findWidths(cliTable).map(w => Array(w).join('-'));
}

function findWidths(cliTable: CLITable.Table): number[] {
  return [(cliTable as any).options.head]
    .concat(getRows(cliTable))
    .reduce((colWidths, row) => row.map((str: string, i: number) => Math.max(`${str}`.length + 1, colWidths[i] || 1)), []);
}

function getRows(cliTable: CLITable.Table) {
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

function attachTemplate(context: $TSContext) {
  context.template = {
    async generate(opts: { template: string; target: string; props: object; directory: string }): Promise<string> {
      const template = opts.template;
      const target = opts.target;
      const props = opts.props || {};
      const data = {
        props,
      };
      // If a directory was supplied, append a directory separator.
      // Otherwise, the template path will be use as-is.
      const pathToTemplate = opts.directory ? path.join(opts.directory, template) : template;

      if (!contextFileSystem.isFile(pathToTemplate)) {
        throw new Error(`template not found ${pathToTemplate}`);
      }

      const templateContent = contextFileSystem.read(pathToTemplate);

      const content = ejs.render(templateContent, data);

      if (target.length > 0) {
        const dir = target.replace(/$(\/)*/g, '');
        const dest = contextFileSystem.path(dir);
        contextFileSystem.write(dest, content);
      }

      return content;
    },
  };
}
