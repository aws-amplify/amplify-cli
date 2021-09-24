import { AddApiRequest, AddAuthRequest, ImportAuthRequest, UpdateApiRequest, UpdateAuthRequest } from 'amplify-headless-interface';
import execa from 'execa';
import { getCLIPath } from '..';

export const addHeadlessApi = async (cwd: string, request: AddApiRequest) => {
  await executeHeadlessCommand(cwd, 'api', 'add', request);
};

export const updateHeadlessApi = async (cwd: string, request: UpdateApiRequest, allowDestructiveUpdates?: boolean) => {
  await executeHeadlessCommand(cwd, 'api', 'update', request, allowDestructiveUpdates);
};

export const removeHeadlessApi = async (cwd: string, apiName: string) => {
  await headlessRemoveResource(cwd, 'api', apiName);
};

export const addHeadlessAuth = async (cwd: string, request: AddAuthRequest) => {
  await executeHeadlessCommand(cwd, 'auth', 'add', request);
};

export const updateHeadlessAuth = async (cwd: string, request: UpdateAuthRequest) => {
  await executeHeadlessCommand(cwd, 'auth', 'update', request);
};

export const removeHeadlessAuth = async (cwd: string, authName: string) => {
  await headlessRemoveResource(cwd, 'auth', authName);
};

export const headlessAuthImport = async (cwd: string, request: ImportAuthRequest) => {
  await executeHeadlessCommand(cwd, 'auth', 'import', request);
};

const headlessRemoveResource = async (cwd: string, category: string, resourceName: string) => {
  await execa(getCLIPath(), ['remove', category, resourceName, '--yes'], { cwd });
};
const executeHeadlessCommand = async (
  cwd: string,
  category: string,
  operation: string,
  request: AnyHeadlessRequest,
  allowDestructiveUpdates: boolean = false,
) => {
  const args = [operation, category, '--headless'];
  if (allowDestructiveUpdates) {
    args.push('--allow-destructive-graphql-schema-updates');
  }
  await execa(getCLIPath(), args, { input: JSON.stringify(request), cwd });
};

type AnyHeadlessRequest = AddApiRequest | UpdateApiRequest | AddAuthRequest | UpdateAuthRequest | ImportAuthRequest;
