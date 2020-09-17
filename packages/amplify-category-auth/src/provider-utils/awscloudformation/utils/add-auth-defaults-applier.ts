import { ServiceQuestionsResult } from '../service-walkthrough-types';
import { verificationBucketName } from './verification-bucket-name';
import { merge } from 'lodash';
import { structureOAuthMetadata } from '../service-walkthroughs/auth-questions';

/**
 * Factory function that returns a function that applies default values to a ServiceQuestionsResult request.
 * It does not overwrite existing values in the request.
 *
 * The logic here has been refactored from service-walkthroughs/auth-questions.js and is mostly unchanged
 * @param defaultValuesFilename The filename to fetch defaults from
 * @param projectName The name of the current project (used to generate some default values)
 */
export const getAddAuthDefaultsApplier = (context: any, defaultValuesFilename: string, projectName: string) => async (
  result: ServiceQuestionsResult,
): Promise<ServiceQuestionsResult> => {
  const { functionMap, generalDefaults, roles, getAllDefaults } = await import(`../assets/${defaultValuesFilename}`);
  result = merge(generalDefaults(projectName), result);

  await verificationBucketName(result);

  structureOAuthMetadata(result, context, getAllDefaults, context.amplify); // adds "oauthMetadata" to result

  /* merge actual answers object into props object,
   * ensuring that manual entries override defaults */
  return merge(functionMap[result.authSelections](result.resourceName), result, roles);
};
