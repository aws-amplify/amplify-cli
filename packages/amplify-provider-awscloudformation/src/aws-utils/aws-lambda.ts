const aws = require('./aws');
import { $TSAny, $TSContext } from 'amplify-cli-core';
import { Lambda as AwsSdkLambda } from 'aws-sdk';
import { LayerVersionsListItem, ListLayerVersionsRequest, ListLayerVersionsResponse } from 'aws-sdk/clients/lambda';
import { loadConfiguration } from '../configuration-manager';
import { AwsSdkConfig } from '../utils/auth-types';
import { fileLogger } from '../utils/aws-logger';
import { pagedAWSCall } from './paged-call';

const logger = fileLogger('aws-lambda');

export class Lambda {
  private lambda: AwsSdkLambda;
  private context: $TSContext;
  constructor(context: $TSContext, options = {}) {
    return (async () => {
      let cred: AwsSdkConfig;
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      this.context = context;
      this.lambda = new aws.Lambda({ ...cred, ...options });
      return this;
    })() as $TSAny;
  }

  public async listLayerVersions(layerNameOrArn: string) {
    const startingParams: ListLayerVersionsRequest = { LayerName: layerNameOrArn, MaxItems: 2 }; // TODO, raise to reasonable limit. Set to 2 for testing
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

  public async deleteLayerVersions(layerNameOrArn: string, versions: number[]) {
    const params = { LayerName: layerNameOrArn, VersionNumber: undefined };
    for (let version of versions) {
      params.VersionNumber = version;
      try {
        await this.lambda.deleteLayerVersion(params).promise();
      } catch (e) {
        this.context.print.error(e); // TODO full error handling
      }
    }
  }
}
