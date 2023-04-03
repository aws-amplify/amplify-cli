import { CLIContext, CLIEnvironmentProvider } from '.';
type EnvInfoProvider = Pick<CLIContext, 'getEnvInfo'>;
export declare class CLIContextEnvironmentProvider implements CLIEnvironmentProvider {
    private context;
    constructor(context: EnvInfoProvider);
    getCurrentEnvName(): string;
}
export {};
//# sourceMappingURL=cliContextEnvironmentProvider.d.ts.map