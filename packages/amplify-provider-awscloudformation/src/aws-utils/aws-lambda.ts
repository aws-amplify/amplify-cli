import { $TSAny, $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import {
  LambdaClient,
  ListLayerVersionsCommand,
  ListLayerVersionsCommandInput,
  ListLayerVersionsCommandOutput,
  DeleteLayerVersionCommand,
  LayerVersionsListItem,
} from '@aws-sdk/client-lambda';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';
import { fileLogger } from '../utils/aws-logger';
import { pagedAWSCall } from './paged-call';
import { proxyAgent } from './aws-globals';

const logger = fileLogger('aws-lambda');

export class Lambda {
  private lambda: LambdaClient;

  constructor(private readonly context: $TSContext, options = {}) {
    return (async () => {
      let cred: AwsSecrets;
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      this.lambda = new LambdaClient({
        ...cred,
        ...options,
        requestHandler: new NodeHttpHandler({
          httpAgent: proxyAgent(),
          httpsAgent: proxyAgent(),
        }),
      });
      return this;
    })() as $TSAny;
  }

  async listLayerVersions(layerNameOrArn: string) {
    const startingParams: ListLayerVersionsCommandInput = { LayerName: layerNameOrArn, MaxItems: 20 };
    const result = await pagedAWSCall<ListLayerVersionsCommandOutput, LayerVersionsListItem, string>(
      async (params: ListLayerVersionsCommandInput, nextMarker?: string) => {
        params = nextMarker ? { ...params, Marker: nextMarker } : params;
        logger('Lambda.listLayerVersions', [params])();
        return await this.lambda.send(new ListLayerVersionsCommand(params));
      },
      startingParams,
      (response) => response?.LayerVersions,
      async (response) => response?.NextMarker,
    );
    return result;
  }

  async deleteLayerVersions(layerNameOrArn: string, versions: number[]) {
    const deletionPromises = [];
    for (const version of versions) {
      const params = {
        LayerName: layerNameOrArn,
        VersionNumber: version,
      };

      deletionPromises.push(async () => {
        try {
          await this.lambda.send(new DeleteLayerVersionCommand(params));
        } catch (err) {
          if (err.name !== 'ParameterNotFound') {
            throw new AmplifyError(
              'LambdaLayerDeleteError',
              {
                message: err.message,
              },
              err,
            );
          }
        }
      });
    }

    try {
      await Promise.all(deletionPromises);
    } catch (e) {
      this.context.print.error(
        'Failed to delete some or all layer versions. Check your internet connection and try again. ' +
          'If the problem persists, try deleting the versions in the Lambda console.',
      );
      e.stack = undefined;
      this.context.print.error(e);
      await this.context.usageData.emitError(e);
    }
  }
}
