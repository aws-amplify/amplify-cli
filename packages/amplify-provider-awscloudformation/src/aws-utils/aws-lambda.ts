const aws = require('./aws');
import { $TSAny, $TSContext } from 'amplify-cli-core';
import { Lambda as AwsSdkLambda } from 'aws-sdk';
import {
  LayerVersionsListItem,
  ListLayerVersionsRequest,
  ListLayerVersionsResponse,
  UpdateFunctionCodeRequest,
  PublishLayerVersionRequest,
} from 'aws-sdk/clients/lambda';
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

  async updateFunctionCode(functionName: string, zipFile: UpdateFunctionCodeRequest['ZipFile']) {
    return this.lambda
      .updateFunctionCode({
        FunctionName: functionName,
        ZipFile: zipFile,
      })
      .promise();
  }

  async updateLayer(
    layerName: string,
    runtimes: PublishLayerVersionRequest['CompatibleRuntimes'],
    zipFile: PublishLayerVersionRequest['Content']['ZipFile'],
  ) {
    return this.lambda
      .publishLayerVersion({
        LayerName: `${layerName}-${this.context.amplify.getEnvInfo().envName}`,
        CompatibleRuntimes: runtimes,
        Content: {
          ZipFile: zipFile,
        },
      })
      .promise();
  }

  async updateLayerVersion(functionName: string, versionedLayerArn: string) {
    const currentConfiguration = await this.lambda.getFunctionConfiguration({ FunctionName: functionName }).promise();

    const unversionedLayerArn = versionedLayerArn.replace(/:[\d]+$/, '');

    const newLayers = currentConfiguration.Layers.map(({ Arn }) => (Arn.startsWith(unversionedLayerArn) ? versionedLayerArn : Arn));

    return this.lambda
      .updateFunctionConfiguration({
        FunctionName: functionName,
        Layers: newLayers,
      })
      .promise();
  }
}
