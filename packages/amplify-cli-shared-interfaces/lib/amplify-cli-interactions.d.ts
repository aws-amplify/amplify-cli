export interface ICommandInput {
    argv: Array<string>;
    plugin?: string;
    command: string;
    subCommands?: string[];
    options?: {
        [key: string]: string | boolean;
    };
}
//# sourceMappingURL=amplify-cli-interactions.d.ts.map