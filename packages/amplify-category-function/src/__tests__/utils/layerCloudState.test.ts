import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { LayerCloudState } from '../../provider-utils/awscloudformation/utils/layerCloudState';

/**
 * Any module that resolves will do here
 */
jest.mock('aws-sdk', () => {
  return {
    getLambdaSdk: jest.fn().mockResolvedValue({
      listLayerVersions: jest.fn().mockReturnValue([]),
    }),
    getCloudFormationSdk: jest.fn().mockReturnValue({
      listStackResources: jest.fn().mockReturnValue({
        StackResourceSummaries: [
          {
            LogicalResourceId: 'a-fake-layer-name',
            ResourceType: 'AWS::CloudFormation::Stack',
          },
        ],
      }),
    }),
  };
});
const LAYER_NAME = 'a-fake-layer-name';
jest.mock('../../provider-utils/awscloudformation/utils/layerHelpers', () => {
  return {
    isMultiEnvLayer: jest.fn().mockImplementation(() => true),
  };
});
describe('When the lambda layer is not found in the deployed stack', () => {
  test('throw an AmplifyError', async () => {
    const cloudState = LayerCloudState.getInstance(LAYER_NAME);
    const context = {
      print: {
        error: jest.fn(),
      },
      usageData: {
        emitError: jest.fn(),
      },
      amplify: {
        getEnvInfo: jest.fn().mockImplementation(() => ({ envName: 'faked-env' })),
        getProviderPlugins: jest.fn().mockImplementation(() => ({
          awscloudformation: 'aws-sdk',
        })),
      },
    };
    const processExit = jest.spyOn(process, 'exit').mockImplementation((__code?: number) => undefined as never);
    await cloudState.getLayerVersionsFromCloud(context as unknown as $TSContext, LAYER_NAME);
    expect(context.usageData.emitError).toHaveBeenCalledWith(
      new Error(
        `An error occurred fetching the latest layer version metadata for "a-fake-layer-name": No versions were found for the Lambda Layer. Were they deleted on the AWS Lambda Console?\n\nThe following layers were not found:\n    * ${LAYER_NAME}\n`,
      ),
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });
});
