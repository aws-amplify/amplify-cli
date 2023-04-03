import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorBaseResolverConfig } from '../type-definition';
import { VelocityTemplate } from '../velocity';
export declare abstract class AppSyncBaseResolver {
    protected config: AppSyncSimulatorBaseResolverConfig;
    protected simulatorContext: AmplifyAppSyncSimulator;
    constructor(config: AppSyncSimulatorBaseResolverConfig, simulatorContext: AmplifyAppSyncSimulator);
    protected getResponseMappingTemplate(): VelocityTemplate;
    protected getRequestMappingTemplate(): VelocityTemplate;
}
//# sourceMappingURL=base-resolver.d.ts.map