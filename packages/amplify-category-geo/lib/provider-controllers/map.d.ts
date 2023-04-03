import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { GeoServiceConfiguration, GeoServiceModification } from 'amplify-headless-interface';
import { MapParameters } from '../service-utils/mapParams';
export declare const addMapResource: (context: $TSContext) => Promise<string>;
export declare const updateMapResource: (context: $TSContext) => Promise<string>;
export declare const removeMapResource: (context: $TSContext) => Promise<string | undefined>;
export declare const addMapResourceHeadless: (context: $TSContext, config: GeoServiceConfiguration) => Promise<string>;
export declare const updateMapResourceHeadless: (context: $TSContext, config: GeoServiceModification) => Promise<string>;
export declare const addMapResourceWithParams: (context: $TSContext, mapParams: Partial<MapParameters>) => Promise<string>;
export declare const updateMapResourceWithParams: (context: $TSContext, mapParams: Partial<MapParameters>) => Promise<string>;
//# sourceMappingURL=map.d.ts.map