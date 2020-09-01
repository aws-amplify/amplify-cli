import { ServiceQuestionsResult } from '../legacy-types';
import { applyAddAuthDefaultsFactory } from '../utils/apply-add-auth-defaults';
import { getResourceSynthesizer } from '../utils/synthesize-resources';

export const getAddAuthHandler = (context: any) => async (request: ServiceQuestionsResult) => {
  const serviceMetadata = require('../supported-services').supportedServices[request.serviceName];
  const { cfnFilename, defaultValuesFilename, provider } = serviceMetadata;
  let projectName = context.amplify.getProjectConfig().projectName.toLowerCase();
  const disallowedChars = /[^A-Za-z0-9]+/g;
  projectName = projectName.replace(disallowedChars, '');
  return applyAddAuthDefaultsFactory(
    defaultValuesFilename,
    projectName,
  )(request)
    .then(getResourceSynthesizer(context, cfnFilename, provider))
    .then(request => request.resourceName);
};
