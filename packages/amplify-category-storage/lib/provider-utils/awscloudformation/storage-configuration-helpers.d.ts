import { $TSContext, $TSObject } from 'amplify-cli-core';
import { AddStorageRequest, ImportStorageRequest, RemoveStorageRequest, UpdateStorageRequest } from 'amplify-headless-interface';
export declare const permissionMap: $TSObject;
export declare function headlessAddStorage(context: $TSContext, storageRequest: AddStorageRequest): Promise<void>;
export declare function headlessUpdateStorage(context: $TSContext, storageRequest: UpdateStorageRequest): Promise<void>;
export declare function headlessImportStorage(context: $TSContext, storageRequest: ImportStorageRequest): Promise<void>;
export declare function headlessRemoveStorage(context: $TSContext, storageRequest: RemoveStorageRequest): Promise<void>;
export declare const checkIfAuthExists: () => boolean;
export declare function getAuthResourceName(context: $TSContext): Promise<any>;
//# sourceMappingURL=storage-configuration-helpers.d.ts.map