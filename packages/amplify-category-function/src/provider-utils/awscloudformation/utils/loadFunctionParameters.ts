import { $TSAny, JSONUtilities } from 'amplify-cli-core';
import _ from 'lodash';
import * as path from 'path';
import { functionParametersFileName } from './constants';

export const loadFunctionParameters = (resourcePath: string) => {
  const funcParams = JSONUtilities.readJson<$TSAny>(path.join(resourcePath, functionParametersFileName), { throwIfNotExist: false }) || {};

  // there was a bug where permissions were nested within "mutableParametersState" in the file so the following is necessary to ensure
  // forward compatability with functions whose permissions were updated with a version of the CLI where the bug existed
  if (funcParams.mutableParametersState) {
    _.assign(funcParams, { ...funcParams.mutableParametersState });
    delete funcParams.mutableParametersState;
  }
  return funcParams;
};
