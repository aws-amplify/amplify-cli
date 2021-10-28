import {
  AddApiRequest,
  AddAuthRequest,
  AddStorageRequest,
  ImportAuthRequest,
  ImportStorageRequest,
  RemoveStorageRequest,
  UpdateApiRequest,
  UpdateAuthRequest,
  UpdateStorageRequest,
} from 'amplify-headless-interface';
import execa, { ExecaChildProcess } from 'execa';
import { getCLIPath } from '..';

export const addHeadlessApi = async (cwd: string, request: AddApiRequest): Promise<ExecaChildProcess<String>> => {
  return await executeHeadlessCommand(cwd, 'api', 'add', request);
};

export const updateHeadlessApi = async (
  cwd: string,
  request: UpdateApiRequest,
  allowDestructiveUpdates?: boolean,
): Promise<ExecaChildProcess<String>> => {
  return await executeHeadlessCommand(cwd, 'api', 'update', request, undefined, allowDestructiveUpdates);
};

export const removeHeadlessApi = async (cwd: string, apiName: string): Promise<ExecaChildProcess<String>> => {
  return await headlessRemoveResource(cwd, 'api', apiName);
};

export const addHeadlessAuth = async (cwd: string, request: AddAuthRequest): Promise<ExecaChildProcess<String>> => {
  return await executeHeadlessCommand(cwd, 'auth', 'add', request);
};

export const updateHeadlessAuth = async (cwd: string, request: UpdateAuthRequest, settings: any): Promise<ExecaChildProcess<String>> => {
  return await executeHeadlessCommand(cwd, 'auth', 'update', request, settings);
};

export const removeHeadlessAuth = async (cwd: string, authName: string): Promise<ExecaChildProcess<String>> => {
  return await headlessRemoveResource(cwd, 'auth', authName);
};

export const headlessAuthImport = async (cwd: string, request: ImportAuthRequest): Promise<ExecaChildProcess<String>> => {
  return await executeHeadlessCommand(cwd, 'auth', 'import', request);
};

export const addHeadlessStorage = async (cwd: string, request: AddStorageRequest): Promise<ExecaChildProcess<String>> => {
  return await executeHeadlessCommand(cwd, 'storage', 'add', request);
};

export const importHeadlessStorage = async (
  cwd: string,
  request: ImportStorageRequest,
  reject: boolean = true,
): Promise<ExecaChildProcess<String>> => {
  return await executeHeadlessCommand(cwd, 'storage', 'import', request, reject);
};

export const removeHeadlessStorage = async (cwd: string, request: RemoveStorageRequest): Promise<ExecaChildProcess<String>> => {
  return await executeHeadlessCommand(cwd, 'storage', 'remove', request);
};

export const updateHeadlessStorage = async (cwd: string, request: UpdateStorageRequest): Promise<ExecaChildProcess<String>> => {
  return await executeHeadlessCommand(cwd, 'storage', 'update', request);
};

const headlessRemoveResource = async (cwd: string, category: string, resourceName: string): Promise<ExecaChildProcess<String>> => {
  return await execa(getCLIPath(), ['remove', category, resourceName, '--yes'], { cwd });
};

const executeHeadlessCommand = async (
  cwd: string,
  category: string,
  operation: string,
  request: AnyHeadlessRequest,
  reject: boolean = true,
  allowDestructiveUpdates: boolean = false,
  settings?: any,
): Promise<ExecaChildProcess<String>> => {
  const args = [operation, category, '--headless'];
  if (allowDestructiveUpdates) {
    args.push('--allow-destructive-graphql-schema-updates');
  }
  return await execa(getCLIPath(settings.testingWithLatestCodebase), args, { input: JSON.stringify(request), cwd, reject });
};

type AnyHeadlessRequest =
  | AddApiRequest
  | UpdateApiRequest
  | AddAuthRequest
  | UpdateAuthRequest
  | ImportAuthRequest
  | AddStorageRequest
  | ImportStorageRequest
  | RemoveStorageRequest
  | UpdateStorageRequest;
