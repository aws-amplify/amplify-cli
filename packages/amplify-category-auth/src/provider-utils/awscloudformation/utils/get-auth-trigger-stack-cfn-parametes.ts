import { $TSContext, AmplifyFault } from 'amplify-cli-core';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { AttributeType } from '../service-walkthrough-types/awsCognito-user-input-types';

/**
 *
 * returns CFN parameters required by root stack from Auth trigger Stack
 */
export const getAuthTriggerStackCfnParameters = async (context: $TSContext, authResourceName: string): Promise<AuthTriggerCfnTypes> => {
  const authState = new AuthInputState(context, authResourceName);
  if (!authState.cliInputFileExists) {
    throw new AmplifyFault('AuthCategoryFault', {
      message: `${authResourceName} cli-inputs.json file not found`,
      resolution: 'add auth resource using amplify category auth',
    });
  }
  const { cognitoConfig } = authState.getCLIInputPayload();
  const configureSMS = (cognitoConfig.autoVerifiedAttributes && cognitoConfig.autoVerifiedAttributes.includes('phone_number'))
  || (cognitoConfig.mfaConfiguration !== 'OFF' && cognitoConfig.mfaTypes && cognitoConfig.mfaTypes.includes('SMS Text Message'))
  || (cognitoConfig.requiredAttributes && cognitoConfig.requiredAttributes.includes('phone_number'))
  || (cognitoConfig.usernameAttributes && cognitoConfig.usernameAttributes.includes(AttributeType.PHONE_NUMBER));
  const authRootStackResourceName = `auth${authResourceName}`;

  const authTriggerRootStackParams:AuthTriggerCfnTypes = {
    userpoolId: {
      'Fn::GetAtt': [authRootStackResourceName, 'Outputs.UserPoolId'],
    },
    userpoolArn: {
      'Fn::GetAtt': [authRootStackResourceName, 'Outputs.UserPoolArn'],
    },
  };

  if (!cognitoConfig.useEnabledMfas || configureSMS) {
    authTriggerRootStackParams.snsRoleArn = {
      'Fn::GetAtt': [authRootStackResourceName, 'Outputs.CreatedSNSRole'],
    };
  }
  return authTriggerRootStackParams;
};

/**
 * type returned to Root Stack cfn parameter for auth trigger
 */
export type AuthTriggerCfnTypes = {
    userpoolId: Record<'Fn::GetAtt', string[]>,
    userpoolArn: Record<'Fn::GetAtt', string[]>,
    snsRoleArn?: Record<'Fn::GetAtt', string[]>
}
