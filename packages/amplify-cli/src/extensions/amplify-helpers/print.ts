import importedColors from 'colors/safe';
import CLITable from 'cli-table3';

//TODO: refector, this is a copy of conext-extensions.ts
importedColors.setTheme({
  highlight: 'cyan',
  info: 'reset',
  warning: 'yellow',
  success: 'green',
  error: 'red',
  line: 'grey',
  muted: 'grey',
});

type CLIPrintColors = typeof importedColors & {
  info: (t: string) => string;
  warning: (t: string) => string;
  success: (t: string) => string;
  error: (t: string) => string;
};

const colors = importedColors as CLIPrintColors;

/**
 * @deprecated Use printer.info from amplify-prompts instead
 */
function info(message) {
  console.log(colors.info(message));
}

/**
 * @deprecated Use printer.warn from amplify-prompts instead
 */
function warning(message) {
  console.log(colors.warning(message));
}

/**
 * @deprecated Use printer.error from amplify-prompts instead
 */
function error(message) {
  console.log(colors.error(message));
}

/**
 * @deprecated Use printer.success from amplify-prompts instead
 */
function success(message) {
  console.log(colors.success(message));
}

/**
 * @deprecated Use printer.debug from amplify-prompts instead
 */
function debug(message, title = 'DEBUG') {
  const topLine = `vvv -----[ ${title} ]----- vvv`;
  const botLine = `^^^ -----[ ${title} ]----- ^^^`;

  console.log(colors.rainbow(topLine));
  console.log(message);
  console.log(colors.rainbow(botLine));
}

/**
 * @deprecated The next time we refactor code that uses this function, refactor the table function into formatter.ts from amplify-prompts and use that instead
 */
function table(data, options: any = {}) {
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
    case 'lean': {
      t = new CLITable({
        style: { head: ['reset'] }, // "no color"
      });
      t.push(...data);
      break;
    }
    default: {
      t = new CLITable({
        style: { head: ['reset'] }, // "no color"
        chars: CLI_TABLE_COMPACT,
      });
      t.push(...data);
    }
  }
  console.log(t.toString());
}

function columnHeaderDivider(cliTable) {
  return findWidths(cliTable).map(w => Array(w).join('-'));
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

/**
 * @deprecated Use printer from amplify-prompts instead
 */
export const print = {
  info,
  warning,
  error,
  success,
  table,
  debug,
};
