import { $TSContext, pathManager, stateManager, JSONUtilities, $TSObject } from "amplify-cli-core";
import * as path from 'path';
import _ = require('lodash');
import { ServiceName } from 'amplify-category-function';

type LambdaTriggerNames = string[];
type LambdaTriggersMap = { [index: string] : LambdaTriggerNames};

/**
 * Checks the function CFN templates for event source mappings that 
 * correspond to the DDB stream of any of the tables
 * @param context The CLI context
 * @param tables List of known tables that each correspond to a '@model' type
 * @returns Map with keys as table names and values as list of lambda function names attached
 */
 export const findLambdaTriggers = async (context: $TSContext , tables: string[]): Promise<LambdaTriggersMap> => {
    const lambdaTriggersMap: LambdaTriggersMap = {};
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
          lambdaTriggersMap[attachedTable].push(resourceName);
        }
        else {
          lambdaTriggersMap[attachedTable] = [resourceName];
        }
      });
    })
    return lambdaTriggersMap;
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
  