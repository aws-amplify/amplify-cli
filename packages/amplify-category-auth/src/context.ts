import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { CognitoConfiguration } from './provider-utils/awscloudformation/service-walkthrough-types/awsCognito-user-input-types';
export { CognitoConfiguration };
export type AuthContext = $TSContext & {
  updatingAuth: CognitoConfiguration;
};
