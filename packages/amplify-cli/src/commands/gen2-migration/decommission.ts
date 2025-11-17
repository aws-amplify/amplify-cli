import ora from 'ora';
import { AmplifyMigrationStep } from './_step';
import { printer } from '@aws-amplify/amplify-prompts';
import { $TSContext, AmplifyError, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { AmplifyClient, DeleteBackendEnvironmentCommand, ListAppsCommand, ListBackendEnvironmentsCommand } from '@aws-sdk/client-amplify';
import {
  CloudFormationClient,
  DeleteStackCommand,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  waitUntilStackDeleteComplete,
} from '@aws-sdk/client-cloudformation';
import { S3Client, DeleteBucketCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { PinpointClient, DeleteAppCommand } from '@aws-sdk/client-pinpoint';
import { SSMClient, DeleteParametersCommand, GetParametersByPathCommand } from '@aws-sdk/client-ssm';
import { prompt } from 'inquirer';

export class AmplifyMigrationDecommissionStep extends AmplifyMigrationStep {
  readonly command = 'decommission';
  readonly describe = 'Decommission Gen1 resources';

  public async validate(): Promise<void> {
    printer.warn('Not implemented');
  }

  /**
   * NOTE: This implementation was a trial run to see if we could implement a way to remove env for decommissioning step
   * in the gen2-migration workflow without relying on amplify apps' gen1 local files. The current implementation has a bug
   * in correctly identifying the env using listAllApps and listAllEnvs commands. A possible workaround is to give users
   * the control to use the command as decommission --app-id --env-name, but giving users that control could be risky.
   * For now, we are relying on the implementation by reusing the amplify env remove command.
   */
  public async execute(): Promise<void> {
    const context = this.getContext();
    const envName = context.parameters.first;

    if (!envName) {
      throw new AmplifyError('EnvironmentNameError', {
        message: 'Environment name was not specified.',
        resolution: 'Pass in the name of the environment.',
      });
    }

    const { confirm } = await prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete the Gen1 environment "${envName}"? This action cannot be undone.`,
        default: false,
      },
    ]);

    if (!confirm) {
      printer.info('Decommission cancelled.');
      return;
    }

    const spinner = ora('Deleting Gen1 resources from the cloud.');
    spinner.start();

    try {
      let amplifyAppId: string | undefined;
      let stackName: string | undefined;
      let deploymentBucket: string | undefined;
      let nextToken: string | undefined;
      let region: string | undefined;

      const amplifyClient = new AmplifyClient({});

      do {
        const listAppsResponse = await amplifyClient.send(
          new ListAppsCommand({
            nextToken,
            maxResults: 25,
          }),
        );

        for (const app of listAppsResponse.apps || []) {
          const listEnvsResponse = await amplifyClient.send(
            new ListBackendEnvironmentsCommand({
              appId: app.appId,
            }),
          );

          const backendEnv = listEnvsResponse.backendEnvironments?.find((env) => env.environmentName === envName);
          if (backendEnv) {
            amplifyAppId = app.appId;
            stackName = backendEnv.stackName;
            deploymentBucket = backendEnv.deploymentArtifacts;
            region = backendEnv.backendEnvironmentArn?.split(':')[3];
            break;
          }
        }

        if (amplifyAppId) break;
        nextToken = listAppsResponse.nextToken;
      } while (nextToken);

      if (!amplifyAppId || !stackName) {
        throw new AmplifyError('ProjectNotFoundError', {
          message: `Environment "${envName}" not found in Amplify service.`,
          resolution: 'Verify the environment name and AWS credentials.',
        });
      }

      const cfnClient = new CloudFormationClient({ region });
      const s3Client = new S3Client({ region });
      const pinpointClient = new PinpointClient({ region });

      // Step 1: Delete Pinpoint
      try {
        const stackResources = await cfnClient.send(new DescribeStackResourcesCommand({ StackName: stackName }));
        const pinpointResource = stackResources.StackResources?.find((r) => r.ResourceType === 'AWS::Pinpoint::App');

        if (pinpointResource?.PhysicalResourceId) {
          await pinpointClient.send(new DeleteAppCommand({ ApplicationId: pinpointResource.PhysicalResourceId }));
        }
      } catch (ex) {
        // Continue if Pinpoint not found
      }

      // Step 2: Delete CloudFormation stack
      try {
        await cfnClient.send(new DeleteStackCommand({ StackName: stackName }));
        await waitUntilStackDeleteComplete({ client: cfnClient, maxWaitTime: 600 }, { StackName: stackName });
      } catch (ex) {
        throw new AmplifyFault(
          'BackendDeleteFault',
          {
            message: `Failed to delete CloudFormation stack: ${stackName}`,
            resolution: 'Check CloudFormation console for stack status and error details.',
          },
          ex,
        );
      }

      // Step 3: Delete from Amplify service
      await amplifyClient.send(
        new DeleteBackendEnvironmentCommand({
          appId: amplifyAppId,
          environmentName: envName,
        }),
      );

      try {
        const ssmClient = new SSMClient({ region });
        const parameterPath = `/amplify/${amplifyAppId}/${envName}/`;
        const parametersResponse = await ssmClient.send(
          new GetParametersByPathCommand({
            Path: parameterPath,
            Recursive: true,
          }),
        );

        if (parametersResponse.Parameters && parametersResponse.Parameters.length > 0) {
          const parameterNames = parametersResponse.Parameters.map((p) => p.Name).filter((name): name is string => !!name);

          if (parameterNames.length > 0) {
            await ssmClient.send(
              new DeleteParametersCommand({
                Names: parameterNames,
              }),
            );
          }
        }
      } catch (ex) {
        printer.warn(`Failed to delete SSM parameters: ${ex.message}`);
      }

      // Step 4: Delete deployment bucket
      if (deploymentBucket) {
        try {
          let continuationToken;
          do {
            const listResponse = await s3Client.send(
              new ListObjectsV2Command({
                Bucket: deploymentBucket,
                ContinuationToken: continuationToken,
              }),
            );

            if (listResponse.Contents) {
              for (const obj of listResponse.Contents) {
                await s3Client.send(
                  new DeleteObjectCommand({
                    Bucket: deploymentBucket,
                    Key: obj.Key,
                  }),
                );
              }
            }
            continuationToken = listResponse.NextContinuationToken;
          } while (continuationToken);

          await s3Client.send(new DeleteBucketCommand({ Bucket: deploymentBucket }));
        } catch (ex) {
          if (ex.name !== 'NoSuchBucket') {
            printer.warn(`Failed to delete deployment bucket: ${ex.message}`);
          }
        }
      }

      spinner.succeed('Successfully decommissioned Gen1 environment from the cloud');
    } catch (ex) {
      spinner.fail(`Decommission failed: ${ex.message}`);
      throw new AmplifyFault(
        'BackendDeleteFault',
        {
          message: `Error occurred while deleting env: ${envName}.`,
        },
        ex,
      );
    }
  }

  public async rollback(): Promise<void> {
    printer.warn('Not implemented');
  }

  private getContext(): $TSContext {
    return (this as any).context;
  }
}
