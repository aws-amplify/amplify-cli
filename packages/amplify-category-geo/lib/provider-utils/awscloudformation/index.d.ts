import { MapParameters } from './utils/mapParams';
import { ServiceConfig } from '../supportedServices';
import { ServiceName } from './utils/constants';
export declare function addResource(context: any, category: string, service: string, parameters?: Partial<MapParameters>): Promise<string>;
export declare function addMapResource(context: any, service: string, serviceConfig: ServiceConfig<MapParameters>, parameters?: Partial<MapParameters>): Promise<string>;
export declare function openConsole(context: any, service: ServiceName): void;
//# sourceMappingURL=index.d.ts.map