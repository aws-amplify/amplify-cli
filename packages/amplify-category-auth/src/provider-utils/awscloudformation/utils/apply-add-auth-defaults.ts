import { ServiceQuestionsResult } from '../legacy-types';
import { verificationBucketName } from './verification-bucket-name';

export const applyAddAuthDefaultsFactory = (defaultValuesFilename: string, projectName: string) => async (
  result: ServiceQuestionsResult,
): Promise<ServiceQuestionsResult> => {
  const { functionMap, generalDefaults, roles } = require(`./assets/${defaultValuesFilename}`);

  /* if user has used the default configuration,
   * we populate base choices like authSelections and resourceName for them */
  if (['default', 'defaultSocial'].includes(result.useDefault)) {
    result = Object.assign(generalDefaults(projectName), result);
  }

  await verificationBucketName(result);

  /* merge actual answers object into props object,
   * ensuring that manual entries override defaults */
  return Object.assign(functionMap[result.authSelections](result.resourceName), result, roles);
};
