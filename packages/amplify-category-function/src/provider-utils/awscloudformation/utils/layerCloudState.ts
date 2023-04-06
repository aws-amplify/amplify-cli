import { $TSContext, exitOnNextTick, spinner } from '@aws-amplify/amplify-cli-core';
import { LayerCfnLogicalNamePrefix } from './constants';
// eslint-disable-next-line import/no-cycle
import { isMultiEnvLayer } from './layerHelpers';
import { LegacyPermissionEnum } from './layerMigrationUtils';
import { LayerVersionMetadata, PermissionEnum } from './layerParams';

export class LayerCloudState {
  private static instances: Record<string, LayerCloudState> = {};
  private layerVersionsMetadata: LayerVersionMetadata[];
  public latestVersionLogicalId: string;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getInstance(layerName: string): LayerCloudState {
    if (!LayerCloudState.instances[layerName]) {
      LayerCloudState.instances[layerName] = new LayerCloudState();
    }
    return LayerCloudState.instances[layerName];
  }

  private async loadLayerDataFromCloud(context: $TSContext, layerName: string): Promise<LayerVersionMetadata[]> {
    spinner.start('Loading layer data from the cloud...');
    try {
      const { envName }: { envName: string } = context.amplify.getEnvInfo();
      const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
      const lambdaClient = await providerPlugin.getLambdaSdk(context);
      const layerVersionList = await lambdaClient.listLayerVersions(isMultiEnvLayer(layerName) ? `${layerName}-${envName}` : layerName);
      const cfnClient = await providerPlugin.getCloudFormationSdk(context);
      const stackList = await cfnClient.listStackResources();
      const layerStacks = stackList?.StackResourceSummaries?.filter(
        // do this because cdk does some rearranging of resources
        (stack) => stack.LogicalResourceId.includes(layerName) && stack.ResourceType === 'AWS::CloudFormation::Stack',
      );
      let detailedLayerStack;

      if (layerStacks?.length > 0) {
        detailedLayerStack = (await cfnClient.listStackResources(layerStacks[0].PhysicalResourceId)).StackResourceSummaries;
      } else {
        spinner.stop();
        return [];
      }

      layerVersionList.forEach((layerVersion: LayerVersionMetadata) => {
        let layerLogicalIdSuffix: string;
        detailedLayerStack.forEach((stack) => {
          if (stack.ResourceType === 'AWS::Lambda::LayerVersion' && stack.PhysicalResourceId === layerVersion.LayerVersionArn) {
            // eslint-disable-next-line no-param-reassign
            layerVersion.LogicalName = stack.LogicalResourceId;
            layerLogicalIdSuffix = stack.LogicalResourceId.replace(LayerCfnLogicalNamePrefix.LambdaLayerVersion, '');
          }
        });

        detailedLayerStack.forEach((stack) => {
          if (
            stack.ResourceType === 'AWS::Lambda::LayerVersionPermission' &&
            stack.PhysicalResourceId.split('#')[0] === layerVersion.LayerVersionArn
          ) {
            // eslint-disable-next-line no-param-reassign
            layerVersion.permissions = layerVersion.permissions || [];

            const permissionTypeString = stack.LogicalResourceId.replace(
              LayerCfnLogicalNamePrefix.LambdaLayerVersionPermission,
              '',
            ).replace(layerLogicalIdSuffix, '');

            const accountIds = [];
            const orgIds = [];
            if (permissionTypeString === PermissionEnum.Private || permissionTypeString.startsWith(LegacyPermissionEnum.Private)) {
              layerVersion.permissions.push({ type: PermissionEnum.Private });
            } else if (permissionTypeString === PermissionEnum.Public || permissionTypeString.startsWith(LegacyPermissionEnum.Public)) {
              layerVersion.permissions.push({ type: PermissionEnum.Public });
            } else if (permissionTypeString.startsWith(PermissionEnum.AwsAccounts)) {
              accountIds.push(permissionTypeString.replace(PermissionEnum.AwsAccounts, '').replace(`Legacy${layerVersion.Version}`, ''));
            } else if (permissionTypeString.startsWith(LegacyPermissionEnum.AwsAccounts)) {
              accountIds.push(permissionTypeString.replace(LegacyPermissionEnum.AwsAccounts, '').substring(0, 12));
            } else if (permissionTypeString.startsWith(PermissionEnum.AwsOrg)) {
              const orgId = permissionTypeString.replace(`${PermissionEnum.AwsOrg}o`, 'o-').replace(`Legacy${layerVersion.Version}`, '');
              orgIds.push(orgId);
            } else if (permissionTypeString.startsWith(LegacyPermissionEnum.AwsOrg)) {
              const suffix = `${layerVersion.Version}`;
              const orgId = permissionTypeString.replace(`${LegacyPermissionEnum.AwsOrg}o`, 'o-').slice(0, -1 * suffix.length);
              orgIds.push(orgId);
            }

            if (accountIds.length > 0) {
              layerVersion.permissions.push({
                type: PermissionEnum.AwsAccounts,
                accounts: accountIds,
              });
            }
            if (orgIds.length > 0) {
              layerVersion.permissions.push({
                type: PermissionEnum.AwsOrg,
                // eslint-disable-next-line spellcheck/spell-checker
                orgs: orgIds,
              });
            }
          }
        });

        // eslint-disable-next-line no-param-reassign
        layerVersion.legacyLayer = layerVersion.LogicalName === undefined || layerVersion.LogicalName === 'LambdaLayer';
      });
      this.layerVersionsMetadata = layerVersionList.sort((a: LayerVersionMetadata, b: LayerVersionMetadata) => b.Version - a.Version);
      this.latestVersionLogicalId = this.layerVersionsMetadata[0].LogicalName;
    } catch (e) {
      spinner.fail();
      const errMessage = `An error occurred fetching the latest layer version metadata for "${layerName}": ${e.message || e}`;
      context.print.error(errMessage);
      await context.usageData.emitError(new Error(errMessage));
      exitOnNextTick(1);
    }
    spinner.stop();
    return this.layerVersionsMetadata;
  }

  public async getLayerVersionsFromCloud(context: $TSContext, layerName: string): Promise<LayerVersionMetadata[]> {
    return this.layerVersionsMetadata || this.loadLayerDataFromCloud(context, layerName);
  }
}
