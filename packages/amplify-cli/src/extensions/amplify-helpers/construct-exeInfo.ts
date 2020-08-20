import { getProjectDetails } from './get-project-details';
import { JSONUtilities } from 'amplify-cli-core';

export function constructExeInfo(context) {
  context.exeInfo = getProjectDetails();
  context.exeInfo.inputParams = {};

  Object.keys(context.parameters.options).forEach(key => {
    const normalizedKey = normalizeKey(key);
    context.exeInfo.inputParams[normalizedKey] = JSONUtilities.parse(context.parameters.options[key]);
  });
}

function normalizeKey(key) {
  if (key === 'y') {
    key = 'yes';
  }
  return key;
}
