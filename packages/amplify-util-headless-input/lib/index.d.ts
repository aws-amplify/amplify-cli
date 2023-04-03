import { AddApiRequest, AddAuthRequest, AddStorageRequest, ImportAuthRequest, ImportStorageRequest, RemoveStorageRequest, UpdateApiRequest, UpdateAuthRequest, UpdateStorageRequest, AddGeoRequest, UpdateGeoRequest } from 'amplify-headless-interface';
export declare const validateAddApiRequest: (raw: string) => Promise<AddApiRequest>;
export declare const validateUpdateApiRequest: (raw: string) => Promise<UpdateApiRequest>;
export declare const validateAddAuthRequest: (raw: string) => Promise<AddAuthRequest>;
export declare const validateUpdateAuthRequest: (raw: string) => Promise<UpdateAuthRequest>;
export declare const validateImportAuthRequest: (raw: string) => Promise<ImportAuthRequest>;
export declare const validateAddStorageRequest: (raw: string) => Promise<AddStorageRequest>;
export declare const validateImportStorageRequest: (raw: string) => Promise<ImportStorageRequest>;
export declare const validateRemoveStorageRequest: (raw: string) => Promise<RemoveStorageRequest>;
export declare const validateUpdateStorageRequest: (raw: string) => Promise<UpdateStorageRequest>;
export declare const validateAddGeoRequest: (raw: string) => Promise<AddGeoRequest>;
export declare const validateUpdateGeoRequest: (raw: string) => Promise<UpdateGeoRequest>;
//# sourceMappingURL=index.d.ts.map