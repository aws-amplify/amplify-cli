import { ArgumentsCamelCase, Argv } from 'yargs';

export async function runCommandAsync(parser: Argv, command: string): Promise<string> {
  return new Promise((res, rej) => {
    parser
      .parseAsync(command, (error: Error | undefined, __: ArgumentsCamelCase<any>, output: string) => {
        if (error) {
          rej(error);
        } else {
          res(output);
        }
      })
      .catch(rej);
  });
}
