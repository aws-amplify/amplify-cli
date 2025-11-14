import { AmplifyMigrationStep } from './_step';
import { printer } from '@aws-amplify/amplify-prompts';
import { stateManager } from '@aws-amplify/amplify-cli-core';
import { CloudFormationClient, SetStackPolicyCommand } from '@aws-sdk/client-cloudformation';
import { AmplifyGen2MigrationValidations } from './_validations';

export class AmplifyMigrationLockStep extends AmplifyMigrationStep {
  public async validate(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations({} as any);
    await validations.validateDeploymentStatus();
  }

  public async execute(): Promise<void> {
    const amplifyMeta = stateManager.getMeta();
    const stackName = amplifyMeta?.providers?.awscloudformation?.StackName;

    const stackPolicy = {
      Statement: [
        {
          Effect: 'Deny',
          Action: 'Update:*',
          Principal: '*',
          Resource: '*',
        },
      ],
    };

    const cfnClient = new CloudFormationClient({});
    await cfnClient.send(
      new SetStackPolicyCommand({
        StackName: stackName,
        StackPolicyBody: JSON.stringify(stackPolicy),
      }),
    );

    printer.success(`Stack ${stackName} has been locked`);
  }

  public async rollback(): Promise<void> {
    printer.warn('Not implemented');
  }
}
