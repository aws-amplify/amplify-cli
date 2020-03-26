import { FunctionParameters } from 'amplify-function-plugin-interface';
import _ from 'lodash';

// Merges other with existing in a non-destructive way.
// Specifically, scalar values will not be overwritten
// Objects will have field added but not removed or modified
// Arrays will be appended to
export function merge(existing: Partial<FunctionParameters>, other: Partial<FunctionParameters>): Partial<FunctionParameters> {
  const mergeFunc = (oldVal: any, newVal: any) => {
    if (!_.isObject(oldVal)) {
      return oldVal;
    }
    if (_.isArray(oldVal)) {
      return oldVal.concat(newVal);
    }
  };
  return _.mergeWith(existing, other, mergeFunc);
}

export function isComplete(partial: Partial<FunctionParameters>): partial is FunctionParameters {
  const requiredFields = ['providerContext', 'cloudResourceTemplatePath', 'resourceName', 'functionName', 'runtime', 'roleName'];
  const missingField = requiredFields.find(field => !_.keys(partial).includes(field));
  return !missingField;
}

export function convertToComplete(partial: Partial<FunctionParameters>): FunctionParameters {
  if (isComplete(partial)) {
    return partial as FunctionParameters;
  }
  throw new Error('Partial<FunctionParameters> does not satisfy FunctionParameters');
}
