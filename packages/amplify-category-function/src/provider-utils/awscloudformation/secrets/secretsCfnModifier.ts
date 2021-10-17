import { SecretDeltas } from 'amplify-function-plugin-interface';
import { Fn } from 'cloudform-types';
import Policy from 'cloudform-types/types/iam/policy';
import Lambda from 'cloudform-types/types/lambda';
import Template from 'cloudform-types/types/template';
import _ from 'lodash';
import { hasExistingSecrets } from './secretDeltaUtilities';
import { getFunctionSecretCfnName, getFunctionSecretCfnPrefix, secretsPathAmplifyAppIdKey } from './secretName';

/**
 * Makes changes to the function CFN template to support secrets via SSM Parameter Store
 * It sets env vars for the function for the secret names and adds a policy to the lambda execution role to access the secrets
 *
 * @param cfnTemplate The template which is modified in place and returned
 * @param secretDeltas The secret configuration to update
 * @param functionName The name of the function
 * @returns The modified cfnTemplate
 */
export const updateSecretsInCfnTemplate = async (
  cfnTemplate: Template,
  secretDeltas: SecretDeltas,
  functionName: string,
): Promise<Template> => {
  const lambdaCfn = cfnTemplate?.Resources?.LambdaFunction as Lambda.Function;

  if (!lambdaCfn) {
    throw new Error('CFN template does not have a resource with logical ID "LambdaFunction"');
  }

  // update secrets env vars
  let envVarsCfn = lambdaCfn?.Properties?.Environment?.Variables;
  if (!envVarsCfn) {
    _.set(lambdaCfn, ['Properties', 'Environment', 'Variables'], {});
    envVarsCfn = lambdaCfn.Properties.Environment.Variables;
  }

  Object.entries(secretDeltas).forEach(([secretName, secretDelta]) => {
    switch (secretDelta.operation) {
      case 'remove':
        delete envVarsCfn[secretName];
        break;
      case 'set':
      case 'retain': // retained values should already be present, but setting them again just to make sure
        envVarsCfn[secretName] = getFunctionSecretCfnName(secretName, functionName);
        break;
    }
  });

  const hasSecrets = hasExistingSecrets(secretDeltas);

  // update policy to access secrets
  if (hasSecrets) {
    cfnTemplate.Resources.AmplifyFunctionSecretsPolicy = getFunctionSecretsPolicy(functionName);
  } else {
    // if all secrets have been removed, remove the policy
    cfnTemplate.Resources.AmplifyFunctionSecretsPolicy = undefined;
  }

  // add app id param
  if (hasSecrets) {
    cfnTemplate.Parameters[secretsPathAmplifyAppIdKey] = {
      Type: 'String',
    };
  } else {
    cfnTemplate.Parameters[secretsPathAmplifyAppIdKey] = undefined;
  }

  return cfnTemplate;
};

// constructs an IAM policy that grants read access to all parameters that have this function's name prefix
const getFunctionSecretsPolicy = (functionName: string) => {
  const policy = new Policy({
    PolicyName: 'amplify-function-secrets-policy',
    Roles: [
      Fn.Ref('LambdaExecutionRole'), // this is tightly coupled to the role name in the lambda CFN template
    ],
    PolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['ssm:GetParameter', 'ssm:GetParameters'],
          Resource: Fn.Join('', [
            'arn:aws:ssm:',
            Fn.Ref('AWS::Region'),
            ':',
            Fn.Ref('AWS::AccountId'),
            ':parameter',
            getFunctionSecretCfnPrefix(functionName),
            '*',
          ]),
        },
      ],
    },
  });
  policy.DependsOn = ['LambdaExecutionRole'];
  return policy;
};
