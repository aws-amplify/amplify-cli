import { $TSContext, AmplifyFault } from 'amplify-cli-core';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { configureSmsOption } from './configure-sms';

/**
 *
 * returns CFN parameters required by root stack from Auth trigger Stack
 */
export const getAuthTriggerStackCfnParameters = async (context: $TSContext, authResourceName: string): Promise<AuthTriggerCfnTypes> => {
  const authState = new AuthInputState(context, authResourceName);
  if (!authState.cliInputFileExists) {
    throw new AmplifyFault('AuthCategoryFault', {
      message: `${authResourceName} cli-inputs.json file not found`,
      resolution: 'Add auth using `amplify add auth`',
    });
  }
  const { cognitoConfig } = authState.getCLIInputPayload();
  const configureSMS = configureSmsOption(cognitoConfig);
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
