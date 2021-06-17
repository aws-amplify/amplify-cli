const aws = require('./aws');
import { $TSAny, $TSContext } from 'amplify-cli-core';
import { Lambda as AwsSdkLambda } from 'aws-sdk';
import { LayerVersionsListItem, ListLayerVersionsRequest, ListLayerVersionsResponse } from 'aws-sdk/clients/lambda';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';
import { fileLogger } from '../utils/aws-logger';
import { pagedAWSCall } from './paged-call';

const logger = fileLogger('aws-lambda');

export class Lambda {
  private lambda: AwsSdkLambda;

  constructor(private readonly context: $TSContext, options = {}) {
    return (async () => {
      let cred: AwsSecrets;
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      this.lambda = new aws.Lambda({ ...cred, ...options });
      return this;
    })() as $TSAny;
  }

  async listLayerVersions(layerNameOrArn: string) {
    const startingParams: ListLayerVersionsRequest = { LayerName: layerNameOrArn, MaxItems: 20 };
    const result = await pagedAWSCall<ListLayerVersionsResponse, LayerVersionsListItem, string>(
      async (params: ListLayerVersionsRequest, nextMarker?: string) => {
        params = nextMarker ? { ...params, Marker: nextMarker } : params;
        logger('Lambda.listLayerVersions', [params])();
        return await this.lambda.listLayerVersions(params).promise();
      },
      startingParams,
      (response?) => response?.LayerVersions,
      async response => response?.NextMarker,
    );
    return result;
  }

  async deleteLayerVersions(layerNameOrArn: string, versions: number[]) {
    const params = { LayerName: layerNameOrArn, VersionNumber: undefined };
    const deletionPromises = [];
    for (const version of versions) {
      params.VersionNumber = version;
      deletionPromises.push(this.lambda.deleteLayerVersion(params).promise());
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
