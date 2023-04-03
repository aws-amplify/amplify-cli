import { CommandLineInput } from 'amplify-cli-core/src/types';
export declare class CLIInput implements CommandLineInput {
    argv: Array<string>;
    plugin?: string;
    command: string;
    subCommands?: string[];
    options?: {
        [key: string]: string | boolean;
    };
    constructor(argv: Array<string>);
}
//# sourceMappingURL=command-input.d.ts.map