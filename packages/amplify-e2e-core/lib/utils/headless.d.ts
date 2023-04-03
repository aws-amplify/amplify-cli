import { AddApiRequest, AddAuthRequest, AddStorageRequest, AddGeoRequest, ImportAuthRequest, ImportStorageRequest, RemoveStorageRequest, UpdateApiRequest, UpdateAuthRequest, UpdateStorageRequest, UpdateGeoRequest } from 'amplify-headless-interface';
import { ExecaChildProcess } from 'execa';
export declare const addHeadlessApi: (cwd: string, request: AddApiRequest, settings?: any) => Promise<ExecaChildProcess<string>>;
export declare const updateHeadlessApi: (cwd: string, request: UpdateApiRequest, allowDestructiveUpdates?: boolean, settings?: {
    testingWithLatestCodebase: boolean;
}) => Promise<ExecaChildProcess<string>>;
export declare const removeHeadlessApi: (cwd: string, apiName: string) => Promise<ExecaChildProcess<string>>;
export declare const addHeadlessAuth: (cwd: string, request: AddAuthRequest) => Promise<ExecaChildProcess<string>>;
export declare const updateHeadlessAuth: (cwd: string, request: UpdateAuthRequest, settings?: any) => Promise<ExecaChildProcess<string>>;
export declare const removeHeadlessAuth: (cwd: string, authName: string) => Promise<ExecaChildProcess<string>>;
export declare const headlessAuthImport: (cwd: string, request: ImportAuthRequest) => Promise<ExecaChildProcess<string>>;
export declare const addHeadlessStorage: (cwd: string, request: AddStorageRequest) => Promise<ExecaChildProcess<string>>;
export declare const importHeadlessStorage: (cwd: string, request: ImportStorageRequest, reject?: boolean) => Promise<ExecaChildProcess<string>>;
export declare const removeHeadlessStorage: (cwd: string, request: RemoveStorageRequest) => Promise<ExecaChildProcess<string>>;
export declare const updateHeadlessStorage: (cwd: string, request: UpdateStorageRequest) => Promise<ExecaChildProcess<string>>;
export declare const addHeadlessGeo: (cwd: string, request: AddGeoRequest) => Promise<ExecaChildProcess<string>>;
export declare const updateHeadlessGeo: (cwd: string, request: UpdateGeoRequest) => Promise<ExecaChildProcess<string>>;
