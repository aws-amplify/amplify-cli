import { ServiceQuestionsResult } from '../legacy-types';
import { verificationBucketName } from './verification-bucket-name';
import { merge } from 'lodash';

export const getAddAuthDefaultsApplier = (defaultValuesFilename: string, projectName: string) => async (
  result: ServiceQuestionsResult,
): Promise<ServiceQuestionsResult> => {
  const { functionMap, generalDefaults, roles } = require(`../assets/${defaultValuesFilename}`);
  result = merge(generalDefaults(projectName), result);

  await verificationBucketName(result);

  /* merge actual answers object into props object,
   * ensuring that manual entries override defaults */
  return merge(functionMap[result.authSelections](result.resourceName), result, roles);
};
