import { $TSAny, $TSContext } from '.';
export interface CLIParams {
    cliCommand: string;
    cliSubcommands: string[] | undefined;
    cliOptions: Record<string, $TSAny>;
}
export declare class ViewResourceTableParams {
    private _command;
    private _verbose;
    private _help;
    private _categoryList;
    private _filteredResourceList;
    get command(): string;
    get verbose(): boolean;
    get help(): boolean;
    get categoryList(): string[] | [];
    getCategoryFromCLIOptions(cliOptions: object): string[];
    styleHeader(str: string): string;
    styleCommand(str: string): string;
    styleOption(str: string): string;
    stylePrompt(str: string): string;
    getStyledHelp(): string;
    logErrorException(e: Error, context: $TSContext): void;
    constructor(cliParams: CLIParams);
}
//# sourceMappingURL=cliViewAPI.d.ts.map