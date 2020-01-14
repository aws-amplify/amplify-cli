export class Input {
  argv: Array<string>;
  plugin?: string;
  command?: string;
  subCommands?: string[];
  options?: {
    [key: string]: string | boolean;
  };
  constructor(argv: Array<string>) {
    this.argv = new Array<string>().concat(argv);
  }
}
