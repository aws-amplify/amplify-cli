import { AmplifyAppSyncSimulator } from '..';
import { AppSyncBaseResolver } from './base-resolver';
import { AppSyncSimulatorPipelineResolverConfig } from '../type-definition';
export declare class AppSyncPipelineResolver extends AppSyncBaseResolver {
    protected config: AppSyncSimulatorPipelineResolverConfig;
    constructor(config: AppSyncSimulatorPipelineResolverConfig, simulatorContext: AmplifyAppSyncSimulator);
    resolve(source: any, args: any, context: any, info: any): Promise<{}>;
}
//# sourceMappingURL=pipeline-resolver.d.ts.map