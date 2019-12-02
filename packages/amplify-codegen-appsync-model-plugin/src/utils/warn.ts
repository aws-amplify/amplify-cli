import chalk from 'chalk';
const printedWarnings: string[] = [];

export function printWarning(message: string): void {
  if (!printedWarnings.includes(message)) {
    console.warn(`${chalk.bgYellow.black('warning:')} ${message}`);
    printedWarnings.push(message);
  }
}
