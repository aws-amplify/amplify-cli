import { $TSAny, $TSContext } from 'amplify-cli-core';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';
import aws from './aws.js';

// Currently SNS is used only by Cognito for sending SMS and  has the following SNS mapping
// https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-email-phone-verification.html
const COGNITO_SMS_REGION_MAPPING = {
  'us-east-2': 'us-east-1',
  'ap-south-1': 'ap-southeast-1',
  'ap-northeast-2': 'ap-northeast-1',
  'ca-central-1': 'us-east-1',
  'eu-central-1': 'eu-west-1',
  'eu-west-2': 'eu-west-1',
};
export class SNS {
  private static instance: SNS;
  private readonly sns: AWS.SNS;

  static async getInstance(context: $TSContext, options = {}): Promise<SNS> {
    if (!SNS.instance) {
      let cred: AwsSecrets = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      // Map the region to correct region mapping.
      if (Object.keys(COGNITO_SMS_REGION_MAPPING).includes(cred.region)) {
        cred.region = COGNITO_SMS_REGION_MAPPING[cred.region];
      }

      SNS.instance = new SNS(context, cred, options);
    }
    return SNS.instance;
  }

  private constructor(context: $TSContext, cred: $TSAny, options = {}) {
    this.sns = new aws.SNS({ ...cred, ...options });
  }

  public async isInSandboxMode(): Promise<boolean> {
    const result = await this.sns.getSMSSandboxAccountStatus().promise();
    return result.IsInSandbox;
  }
}
