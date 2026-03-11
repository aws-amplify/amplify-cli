import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

/**
 * Single instantiation point for all AWS SDK clients used by the refactor command.
 * Created once, injected into facades and leaf mutation functions.
 */
export class AwsClients {
  public readonly cfn: CloudFormationClient;
  public readonly ssm: SSMClient;
  public readonly cognito: CognitoIdentityProviderClient;

  constructor(params: { readonly region: string }) {
    this.cfn = new CloudFormationClient({ region: params.region });
    this.ssm = new SSMClient({ region: params.region });
    this.cognito = new CognitoIdentityProviderClient({ region: params.region });
  }
}
