import inquirer from 'inquirer';
import { ResourceDoesNotExistError, exitOnNextTick } from 'amplify-cli-core';
export async function askAnalyticsCategoryKinesisQuestions(context: any) {
  const { amplify } = context;
  const { allResources } = await amplify.getResourceStatus();
  const kinesisResources = allResources.filter((resource: any) => resource.service === 'Kinesis');

  let targetResourceName;
  if (kinesisResources.length === 0) {
    const errMessage = 'No Kinesis streams resource to select. Please use "amplify add analytics" command to create a new Kinesis stream';
    context.print.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
    return undefined;
  } else if (kinesisResources.length === 1) {
    targetResourceName = kinesisResources[0].resourceName;
    context.print.success(`Selected resource ${targetResourceName}`);
  } else {
    const resourceNameQuestion = {
      type: 'list',
      name: 'kinesisAnalyticsResourceName',
      message: 'Select an Analytics resource Kinesis stream to associate with',
      choices: kinesisResources.map((resource: any) => resource.resourceName),
    };

    const answer: any = await inquirer.prompt([resourceNameQuestion]);
    targetResourceName = answer.kinesisAnalyticsResourceName;
  }

  const streamArnParamRef = {
    Ref: `analytics${targetResourceName}kinesisStreamArn`,
  };

  return {
    triggerEventSourceMappings: [
      {
        batchSize: 100,
        startingPosition: 'LATEST',
        eventSourceArn: streamArnParamRef,
        functionTemplateType: 'kinesis',
        functionTemplateName: 'Kinesis.cs.ejs',
        triggerPolicies: [
          {
            Effect: 'Allow',
            Action: [
              'kinesis:DescribeStream',
              'kinesis:DescribeStreamSummary',
              'kinesis:GetRecords',
              'kinesis:GetShardIterator',
              'kinesis:ListShards',
              'kinesis:ListStreams',
              'kinesis:SubscribeToShard',
            ],
            Resource: streamArnParamRef,
          },
        ],
      },
    ],
    dependsOn: [
      {
        category: 'analytics',
        resourceName: targetResourceName,
        attributes: ['kinesisStreamArn'],
      },
    ],
  };
}
