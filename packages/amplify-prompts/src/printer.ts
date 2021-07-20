import { isDebug, isSilent } from './flags';

export class AmplifyPrinter implements Printer {
  constructor(private readonly outputStream: NodeJS.WritableStream = process.stdout) {}

  debug = (line: string): void => {
    if (isDebug) {
      this.writeSilenceableLine(line);
    }
  };

  info = (line: string): void => {
    this.writeSilenceableLine(line);
  };

  success = (line: string): void => {
    this.writeSilenceableLine(`✅ ${line}`);
  };

  warn = (line: string): void => {
    this.writeLine(`⚠️ ${line}`);
  };

  error = (line: string): void => {
    this.writeLine(`🛑 ${line}`);
  };

  private writeSilenceableLine = (line: string): void => {
    if (!isSilent) {
      this.writeLine(line);
    }
  };

  private writeLine = (line: string): void => {
    this.outputStream.write(`${line}\n`);
  };
}

/**
 * Convenience export that predefines a default printer
 */
export const printer: Printer = new AmplifyPrinter();

export type Printer = Record<LineType, (line: string) => void>;

enum LineType {
  debug = 'debug',
  info = 'info',
  success = 'success',
  warn = 'warn',
  error = 'error',
}
