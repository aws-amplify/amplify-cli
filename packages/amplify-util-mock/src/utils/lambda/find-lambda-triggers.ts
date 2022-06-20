import { $TSContext, pathManager, stateManager, JSONUtilities, $TSObject } from "amplify-cli-core";
import * as path from 'path';
import _ = require('lodash');
import { ServiceName } from 'amplify-category-function';

/**
 * Checks the function CFN templates for event source mappings that 
 * correspond to the DDB stream of any of the tables
 * @param context The CLI context
 * @param tables List of known tables that each correspond to a '@model' type
 * @returns List of lambda trigger names for each table if present
 */
 export const findLambdaTriggers = async (context: $TSContext , tables: string[]): Promise<Record<string, string[]>> => {
    const lambdaTriggersMap: { [index: string] : string[]} = {};
    const lambdaNames = _.entries<{ service: string }>(_.get(stateManager.getMeta(), ['function']))
      .filter(([_, funcMeta]) => funcMeta.service === ServiceName.LambdaFunction)
      .map(([key]) => key);
    
    lambdaNames.forEach( (resourceName) => {
      const resourcePath = path.join(pathManager.getBackendDirPath(), 'function', resourceName);
      const { Resources: cfnResources } = JSONUtilities.readJson<{ Resources: $TSObject }>(
        path.join(resourcePath, `${resourceName}-cloudformation-template.json`),
      );
  
      const tablesAttached = tables.filter((tableName: string) => {
        const eventSourceMappingResourceName = `LambdaEventSourceMapping${tableName.substring(0, tableName.lastIndexOf('Table'))}`;
        return cfnResources && cfnResources[eventSourceMappingResourceName] &&
          cfnResources[eventSourceMappingResourceName]?.Type === 'AWS::Lambda::EventSourceMapping' &&
          _.get(cfnResources[eventSourceMappingResourceName], 'Properties.EventSourceArn.Fn::ImportValue.Fn::Sub')?.includes(`:GetAtt:${tableName}:StreamArn`);
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
  