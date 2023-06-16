import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { ResourceParameters, ImportAuthHeadlessParameters, EnvSpecificResourceParameters } from './types';

export const ensureHeadlessParameters = (
  resourceParameters: ResourceParameters,
  headlessParams: ImportAuthHeadlessParameters,
): EnvSpecificResourceParameters => {
  // If we are doing headless mode, validate parameter presence and overwrite the input values from env specific params since they can be
  // different for the current env operation (eg region can mismatch)

  // Validate required arguments to be present
  const missingParams = [];

  if (!headlessParams.userPoolId) {
    missingParams.push('userPoolId');
  }

  if (!headlessParams.webClientId) {
    missingParams.push('webClientId');
  }

  if (!headlessParams.nativeClientId) {
    missingParams.push('nativeClientId');
  }

  if (resourceParameters.authSelections === 'identityPoolAndUserPool' && !headlessParams.identityPoolId) {
    missingParams.push('identityPoolId');
  }

  if (missingParams.length > 0) {
    throw new AmplifyError('InputValidationError', {
      message: `auth headless is missing the following inputParameters ${missingParams.join(', ')}`,
      link: 'https://docs.amplify.aws/cli/usage/headless/#--categories',
    });
  }

  const envSpecificParameters: EnvSpecificResourceParameters = {
    userPoolId: headlessParams.userPoolId,
    userPoolName: '', // Will be filled out later
    webClientId: headlessParams.webClientId,
    nativeClientId: headlessParams.nativeClientId,
  };

  if (resourceParameters.authSelections === 'identityPoolAndUserPool') {
    envSpecificParameters.identityPoolId = headlessParams.identityPoolId;
  }

  return envSpecificParameters;
};
