import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorFunctionResolverConfig } from '../type-definition';
import { AppSyncBaseResolver } from './base-resolver';
export declare class AmplifySimulatorFunction extends AppSyncBaseResolver {
    protected config: AppSyncSimulatorFunctionResolverConfig;
    constructor(config: AppSyncSimulatorFunctionResolverConfig, simulatorContext: AmplifyAppSyncSimulator);
    resolve(source: any, args: any, stash: any, prevResult: any, context: any, info: any): Promise<{
        result: any;
        stash: any;
        hadException: boolean;
        args: any;
    }>;
}
//# sourceMappingURL=function.d.ts.map