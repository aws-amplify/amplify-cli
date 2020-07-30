import path from 'path';
import { functionParametersFileName } from './constants';
import _ from 'lodash';

export const loadFunctionParameters = (context, resourcePath: string) => {
  const funcParams = context.amplify.readJsonFile(path.join(resourcePath, functionParametersFileName), undefined, false) || {};

  // there was a bug where permissions were nested within "mutableParametersState" in the file so the following is necessary to ensure
  // forward compatability with functions whose permissions were updated with a version of the CLI where the bug existed
  if (funcParams.mutableParametersState) {
    _.assign(funcParams, { ...funcParams.mutableParametersState });
    delete funcParams.mutableParametersState;
  }
  return funcParams;
};
