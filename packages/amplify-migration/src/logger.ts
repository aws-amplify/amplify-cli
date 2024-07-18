export interface Logger {
  info(...logs: string[]): void;
  warn(...logs: string[]): void;
  error(...logs: string[]): void;
  log(...logs: string[]): void;
}

export class Logger {
  info = (...logs: string[]) => console.info(...logs);
  warn = (...logs: string[]) => console.warn(...logs);
  log = (...logs: string[]) => console.log(...logs);
  error = (...logs: string[]) => console.error(...logs);
}
