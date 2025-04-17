import { CommandLineInput } from '@aws-amplify/amplify-cli-core';

export class CLIInput implements CommandLineInput {
  argv: Array<string>;
  plugin?: string;
  command = '';
  subCommands?: string[];
  options?: {
    [key: string]: string | boolean;
  };
  constructor(argv: Array<string>) {
    this.argv = new Array<string>().concat(argv);
  }
}
