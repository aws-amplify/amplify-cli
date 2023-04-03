import { AmplifyAppSyncSimulator } from '..';
import { AppSyncBaseResolver } from './base-resolver';
import { AppSyncSimulatorUnitResolverConfig } from '../type-definition';
export declare class AppSyncUnitResolver extends AppSyncBaseResolver {
    protected config: AppSyncSimulatorUnitResolverConfig;
    constructor(config: AppSyncSimulatorUnitResolverConfig, simulatorContext: AmplifyAppSyncSimulator);
    resolve(source: any, args: any, context: any, info: any): Promise<any>;
}
//# sourceMappingURL=unit-resolver.d.ts.map