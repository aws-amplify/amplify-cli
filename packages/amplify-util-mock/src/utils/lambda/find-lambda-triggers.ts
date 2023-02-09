import { $TSContext, pathManager, stateManager, JSONUtilities, $TSObject } from 'amplify-cli-core';
import * as path from 'path';
import _ = require('lodash');
import { ServiceName } from '@aws-amplify/amplify-category-function';
import { getMockSearchableTriggerDirectory } from '../mock-directory';

type LambdaTriggersMap = { [index: string] : LambdaTrigger[]};

export type LambdaTrigger = {
  name?: string,
  config?: LambdaTriggerConfig
}

export type LambdaTriggerConfig = {
  handler: string,
  runtimePluginId: string,
  runtime: string,
  directory: string,
  envVars: $TSObject,
  reBuild: boolean
}

/**
 * Checks the function CFN templates for event source mappings that
 * correspond to the DDB stream of any of the tables
 * @param context The CLI context
 * @param tables List of known tables that each correspond to a '@model' type
 * @returns Map with keys as table names and values as list of lambda triggers attached
 */
export const findModelLambdaTriggers = async (context: $TSContext , tables: string[]): Promise<LambdaTriggersMap> => {
    const lambdaTriggersMap: LambdaTriggersMap = {};
    if (_.isEmpty(tables)) {
      return lambdaTriggersMap;
    }
    const lambdaNames = getLambdaFunctionNames();

    lambdaNames.forEach( (resourceName) => {
      const resourcePath = path.join(pathManager.getBackendDirPath(), 'function', resourceName);
      const { Resources: cfnResources } = JSONUtilities.readJson<{ Resources: $TSObject }>(
        path.join(resourcePath, `${resourceName}-cloudformation-template.json`),
      );

      const tablesAttached = tables.filter((tableName: string) => {
        return isDDBStreamAttached(tableName, cfnResources);
      });

      tablesAttached.forEach( (attachedTable: string) => {
        if (lambdaTriggersMap[attachedTable]) {
          lambdaTriggersMap[attachedTable].push({ name: resourceName });
        }
        else {
          lambdaTriggersMap[attachedTable] = [{ name: resourceName }];
        }
      });
    })
    return lambdaTriggersMap;
}

export const findSearchableLambdaTriggers = async (
  context: $TSContext,
  tables: string[],
  opensearchEndpoint?: URL
): Promise<{ [index: string] : LambdaTrigger }> => {
  const lambdaTriggersMap: { [index: string] : LambdaTrigger } = {};
  if (_.isEmpty(tables) || !opensearchEndpoint) {
    return lambdaTriggersMap;
  }

  tables.forEach ( (table) => {
    const lambdaTriggerConfig = getSearchableLambdaTriggerConfig(context, opensearchEndpoint, table);
    lambdaTriggersMap[table] = { config: lambdaTriggerConfig };
  });

  return lambdaTriggersMap;
}

export const getSearchableLambdaTriggerConfig = (context: $TSContext, opensearchEndpoint: URL, tableName?: string): LambdaTriggerConfig => {
  const mockSearchableTriggerDirectory = getMockSearchableTriggerDirectory(context);
  return {
    handler: 'index.handler',
    runtimePluginId: 'amplify-python-function-runtime-provider',
    runtime: 'python',
    directory: mockSearchableTriggerDirectory,
    envVars: {
      OPENSEARCH_ENDPOINT: opensearchEndpoint,
      DEBUG: '1',
      OPENSEARCH_USE_EXTERNAL_VERSIONING: 'false',
      TABLE_NAME: tableName?.substring(0, tableName?.lastIndexOf('Table')) || ''
    },
    reBuild: false
  }
}

const isDDBStreamAttached = (tableName: string, cfnResources: $TSObject): boolean => {
  const eventSourceMappingResourceName = `LambdaEventSourceMapping${tableName.substring(0, tableName.lastIndexOf('Table'))}`;
  return cfnResources && cfnResources[eventSourceMappingResourceName] &&
    cfnResources[eventSourceMappingResourceName]?.Type === 'AWS::Lambda::EventSourceMapping' &&
    _.get(cfnResources[eventSourceMappingResourceName], 'Properties.EventSourceArn.Fn::ImportValue.Fn::Sub')?.includes(`:GetAtt:${tableName}:StreamArn`);
}

const getLambdaFunctionNames = () => {
  const metaInfo = stateManager.getMeta();
  return _.entries<{ service: string }>(_.get(metaInfo, ['function']))
      .filter(([_, funcMeta]) => funcMeta.service === ServiceName.LambdaFunction)
      .map(([key]) => key);
}
