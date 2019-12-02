import chalk from 'chalk';
const renderedWarnings: string[] = [];

export function printWarning(message: string): void {
  if (!renderedWarnings.includes(message)) {
    console.warn(`${chalk.bgYellow.black('warning:')} ${message}`);
    renderedWarnings.push(message);
  }
}
