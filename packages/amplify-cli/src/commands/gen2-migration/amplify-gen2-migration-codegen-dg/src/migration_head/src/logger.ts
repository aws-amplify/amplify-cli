export interface AppContextLogger {
  info(...logs: string[]): void;
  warn(...logs: string[]): void;
  error(...logs: string[]): void;
  log(...logs: string[]): void;
}

export class AppContextLogger {
  constructor(private appId: string) {}
  info = (...logs: string[]) => console.info(...logs, `App ID: ${this.appId}`);
  warn = (...logs: string[]) => console.warn(...logs, `App ID: ${this.appId}`);
  log = (...logs: string[]) => console.log(...logs, `App ID: ${this.appId}`);
  error = (...logs: string[]) => console.error(...logs, `App ID: ${this.appId}`);
}
