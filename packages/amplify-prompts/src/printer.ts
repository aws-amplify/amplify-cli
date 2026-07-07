import chalk from 'chalk';
import os from 'os';
import { isDebug, isHeadless, isSilent } from './flags';

/**
 * Provides methods for printing lines to a writeable stream (stdout by default)
 */
export class AmplifyPrinter implements Printer {
  constructor(private readonly outputStream: NodeJS.WritableStream = process.stdout) {}

  debug = (line: string): void => {
    if (isDebug) {
      this.writeSilenceableLine(line);
    }
  };

  info = (line: string, color: Color = 'reset'): void => {
    this.writeSilenceableLine(chalk[color](line));
  };

  blankLine = (): void => {
    this.writeSilenceableLine();
  };

  success = (line: string): void => {
    this.writeSilenceableLine(`${isHeadless ? '' : '✅ '}${chalk.green(line)}`);
  };

  warn = (line: string): void => {
    this.writeLine(`${isHeadless ? '' : '⚠️ '}${chalk.yellow(line)}`);
  };

  // disable-eslint-next-line @typescript-eslint/no-explicit-any
  error = (line: string, error?: any): void => {
    this.writeLine(`${isHeadless ? '' : '🛑 '}${chalk.red(line)}`);
    const errorMessage = error?.message ?? error;
    if (errorMessage) {
      this.writeLine(`${chalk.red(errorMessage)}`);
    }
  };

  private writeSilenceableLine = (line?: string): void => {
    if (!isSilent) {
      this.writeLine(line);
    }
  };

  private writeLine = (line = ''): void => {
    this.outputStream.write(`${line}${os.EOL}`);
  };
}

/**
 * Convenience export that predefines a default printer
 */
export const printer: Printer = new AmplifyPrinter();

/**
 * defines the printer type
 */
export type Printer = {
  debug: (line: string) => void;
  info: (line: string, color?: Color) => void;
  blankLine: () => void;
  success: (line: string) => void;
  warn: (line: string) => void;
  error: (line: string, error?: any) => void;
};

type Color = 'green' | 'blue' | 'yellow' | 'red' | 'reset';
