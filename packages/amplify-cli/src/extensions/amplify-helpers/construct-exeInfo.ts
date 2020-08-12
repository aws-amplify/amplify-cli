import { getProjectDetails } from './get-project-details';

export function constructExeInfo(context) {
  context.exeInfo = getProjectDetails();
  context.exeInfo.inputParams = {};
  Object.keys(context.parameters.options).forEach(key => {
    const normalizedKey = normalizeKey(key);
    context.exeInfo.inputParams[normalizedKey] = JSON.parse(context.parameters.options[key]);
  });
}

function normalizeKey(key) {
  if (key === 'y') {
    key = 'yes';
  }
  return key;
}
