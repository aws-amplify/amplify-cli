import { getProjectDetails } from './get-project-details';
import { JSONUtilities, $TSContext } from 'amplify-cli-core';

export function constructExeInfo(context: $TSContext) {
  context.exeInfo = getProjectDetails();
  context.exeInfo.inputParams = {};

  Object.keys(context.parameters.options).forEach(key => {
    const normalizedKey = normalizeKey(key);
    //TODO: refactor argument validation to make sure only JSON is parsed, and not other values
    // preferably it should be done during argument validation in the future
    context.exeInfo.inputParams[normalizedKey] = JSONUtilities.parse(context.parameters.options[key]);
  });
}

function normalizeKey(key) {
  if (key === 'y') {
    key = 'yes';
  }
  return key;
}
