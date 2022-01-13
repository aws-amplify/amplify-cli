import { $TSContext, FeatureFlags } from 'amplify-cli-core';
import _ from 'lodash';
import { immutableAttributes, safeDefaults } from '../constants';
import { CognitoConfiguration } from '../service-walkthrough-types/awsCognito-user-input-types';
import { ServiceQuestionHeadlessResult } from '../service-walkthrough-types/cognito-user-input-types';
import { structureOAuthMetadata } from '../service-walkthroughs/auth-questions';
import { removeDeprecatedProps } from './synthesize-resources';
import { verificationBucketName } from './verification-bucket-name';

/**
 * Factory function that returns a function that applies default values to a CognitoConfiguation request.
 * It does not overwrite existing values in the request.
 *
 * The logic here has been refactored from service-walkthroughs/auth-questions.js and is mostly unchanged
 * @param defaultValuesFilename The filename to fetch defaults from
 * @param projectName The name of the current project (used to generate some default values)
 */
export const getAddAuthDefaultsApplier =
  (context: $TSContext, defaultValuesFilename: string, projectName: string) =>
  async (result: CognitoConfiguration | ServiceQuestionHeadlessResult): Promise<CognitoConfiguration> => {
    const { functionMap, generalDefaults, roles, getAllDefaults } = await import(`../assets/${defaultValuesFilename}`);
    result = assignDefaults({}, generalDefaults(projectName), result);

    await verificationBucketName(result);

    structureOAuthMetadata(result, context, getAllDefaults, context.amplify); // adds "oauthMetadata" to result

    // Make the usernames for Cognito case-insensitive by default when it is created, if feature flag
    // is enabled.
    if (FeatureFlags.getBoolean('auth.enableCaseInsensitivity')) {
      result.usernameCaseSensitive = false;
    }
    // If the feature flag is enabled the MFA TOTP can only be enabled

    result.useEnabledMfas = FeatureFlags.getBoolean('auth.useEnabledMfas');

    /* merge actual answers object into props object,
     * ensuring that manual entries override defaults */
    return assignDefaults({}, functionMap[result.authSelections](result.resourceName), result, roles);
  };

export const getUpdateAuthDefaultsApplier =
  (context: $TSContext, defaultValuesFilename: string, previousResult: CognitoConfiguration) =>
  async (result: CognitoConfiguration | ServiceQuestionHeadlessResult): Promise<CognitoConfiguration> => {
    const { functionMap, getAllDefaults } = await import(`../assets/${defaultValuesFilename}`);
    if (!result.authSelections) {
      result.authSelections = previousResult.authSelections ?? 'identityPoolAndUserPool';
    }

    const defaults = functionMap[result.authSelections](previousResult.resourceName);

    // ensure immutable attributes are removed from result
    immutableAttributes.filter(pv => pv in previousResult).forEach(pv => delete (result as any)[pv]);

    if (['default', 'defaultSocial'].includes(result.useDefault)) {
      safeDefaults.forEach(sd => delete (previousResult as any)[sd]);
    }

    await verificationBucketName(result, previousResult);

    structureOAuthMetadata(result, context, getAllDefaults, context.amplify); // adds "oauthMetadata" to result

    // If there are new trigger selections, make sure they overwrite the previous selections
    if (!_.isEmpty(result.triggers)) {
      previousResult.triggers = Object.assign({}, result.triggers);
    }
    return assignDefaults({}, defaults, removeDeprecatedProps(previousResult), result);
  };

// same as _.assign except undefined values won't overwrite existing values
// typed to accept up to 4 params but could be typed to accept any number of params
const assignDefaults = _.partialRight(_.assignWith, (objValue: unknown, srcValue: unknown) =>
  _.isUndefined(srcValue) ? objValue : srcValue,
) as <T, U, V, W>(a: T, b: U, c?: V, d?: W) => T & U & V & W;
