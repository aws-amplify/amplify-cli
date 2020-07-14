import { AddApiRequest, UpdateApiRequest } from 'amplify-headless-interface';
import execa from 'execa';
import { getCLIPath } from '..';

export const addHeadlessApi = (cwd: string, request: AddApiRequest) => {
  return executeHeadlessCommand(cwd, 'api', 'add', request);
};

export const updateHeadlessApi = async (cwd: string, request: UpdateApiRequest) => {
  return executeHeadlessCommand(cwd, 'api', 'update', request);
};

export const removeHeadlessApi = async (cwd: string, apiName: string) => {
  await execa(getCLIPath(), ['remove', 'api', apiName, '--yes'], { cwd });
};

const executeHeadlessCommand = async (cwd: string, category: string, operation: string, request: AnyHeadlessRequest) => {
  await execa(getCLIPath(), [operation, category, '--headless'], { input: JSON.stringify(request), cwd });
};

type AnyHeadlessRequest = AddApiRequest | UpdateApiRequest;
