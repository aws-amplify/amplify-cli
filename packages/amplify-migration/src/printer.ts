import { WriteStream } from 'node:tty';
import { EOL } from 'os';

export class Printer {
  constructor(
    private readonly minimumLogLevel: LogLevel,
    private readonly stdout: WriteStream | NodeJS.WritableStream = process.stdout,
    private readonly stderr: WriteStream | NodeJS.WritableStream = process.stderr,
    private readonly refreshRate: number = 500,
  ) {}

  /**
   * Prints a given message to output stream followed by a newline.
   */
  print = (message: string) => {
    this.stdout.write(message);
    this.printNewLine();
  };

  /**
   * Prints a new line to output stream
   */
  printNewLine = () => {
    this.stdout.write(EOL);
  };
}

export enum LogLevel {
  ERROR = 0,
  INFO = 1,
  DEBUG = 2,
}

const minimumLogLevel = process.argv.includes('--debug') ? LogLevel.DEBUG : LogLevel.INFO;

export const printer = new Printer(minimumLogLevel);
