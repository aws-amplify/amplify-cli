import { MapParameters } from './awscloudformation/utils/mapParams';
export interface SupportedServices extends Record<string, any> {
    Map: ServiceConfig<MapParameters>;
}
export interface ServiceConfig<T> {
    alias: string;
    walkthroughs: WalkthroughProvider<T>;
    provider: string;
    providerController: any;
}
export interface WalkthroughProvider<T> {
    createWalkthrough: (context: any, params: Partial<T>) => Promise<Partial<T>>;
    updateWalkthrough: (context: any, resourceToUpdate?: string, params?: Partial<T>) => Promise<Partial<T>>;
}
export declare const supportedServices: SupportedServices;
//# sourceMappingURL=supportedServices.d.ts.map