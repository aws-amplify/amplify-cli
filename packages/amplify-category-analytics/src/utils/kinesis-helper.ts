import { $TSAny, $TSContext, $TSMeta, AmplifyCategories, AmplifySupportedService, open } from 'amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

/**
 * opens resource in AWS console
 */
export const console = async (context: $TSContext): Promise<void> => {
  const amplifyMeta = context.amplify.getProjectMeta();
  const { envName } = context.amplify.getEnvInfo();
  const region = context.amplify.getEnvDetails()[envName].awscloudformation.Region;

  const kinesisApp = scanCategoryMetaForKinesis(amplifyMeta[AmplifyCategories.ANALYTICS]);
  if (kinesisApp) {
    const { Id } = kinesisApp;
    const consoleUrl = `https://${region}.console.aws.amazon.com/kinesis/home?region=${region}#/streams/details?streamName=${Id}&tab=details`;
    await open(consoleUrl, { wait: false });
  } else {
    printer.error('Kinesis is not enabled in the cloud.');
  }
};

const scanCategoryMetaForKinesis = (categoryMeta: $TSMeta): $TSAny => {
  // single kinesis resource for now
  let result: $TSAny;
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (const service of services) {
      const serviceMeta = categoryMeta[service];
      if (serviceMeta.service === AmplifySupportedService.KINESIS && serviceMeta.output && serviceMeta.output.kinesisStreamId) {
        result = {
          Id: serviceMeta.output.kinesisStreamId,
        };
        if (serviceMeta.output.Name) {
          result.Name = serviceMeta.output.Name;
        } else if (serviceMeta.output.appName) {
          result.Name = serviceMeta.output.appName;
        }

        if (serviceMeta.output.Region) {
          result.Region = serviceMeta.output.Region;
        }
        break;
      }
    }
  }
  return result;
};

/**
 * checks if the project has a kinesis resource
 */
export const hasResource = (context: $TSContext): boolean => {
  const amplifyMeta = context.amplify.getProjectMeta();
  return scanCategoryMetaForKinesis(amplifyMeta[AmplifyCategories.ANALYTICS]) !== undefined;
};
