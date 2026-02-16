import * as os from 'node:os';
import { cyan, green, red } from 'kleur/colors';

export class Format {
  error = (error: string | Error | unknown): string => {
    if (error instanceof Error) {
      const message = red(`${error.name}: ${error.message}`);

      if (error.cause) {
        return message + os.EOL + this.error(error.cause);
      }
      return message;
    } else if (typeof error === 'string') {
      return red(error);
    }
    try {
      return red(JSON.stringify(error, null, 2));
    } catch (e) {
      return red('Unknown error') + os.EOL + this.error(e);
    }
  };
  command = (command: string) => cyan(command);
  highlight = (command: string) => cyan(command);
  success = (message: string) => green(message);
}

export const format = new Format();
