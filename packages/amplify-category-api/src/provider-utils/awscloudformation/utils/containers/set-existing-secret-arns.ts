import { $TSAny, JSONUtilities, pathManager } from 'amplify-cli-core';
import _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { category } from '../../../../category-constants';
import { cfnFileName } from '../containers-artifacts';
/**
 * Check if the template contains existing secret configuration and if so, add it to the secretsMap
 * The secrets configuration is stored in the template in the following format
 * {
 *   "Resources": {
      "TaskDefinition": {
        "Type": "AWS::ECS::TaskDefinition",
        "Properties": {
          "ContainerDefinitions": [
            {
              "Secrets": [
                {
                  "Name": "SECRETNAME",
                  "ValueFrom": "<some secrets manager arn>"
                }
              }
            }
          ]
        }
      }
    }
  */
export const setExistingSecretArns = (secretsMap: Map<string, string>, resourceName: string) => {
  const cfnPath = path.join(pathManager.getBackendDirPath(), category, resourceName, cfnFileName(resourceName));
  if (!fs.existsSync(cfnPath)) {
    return;
  }
  const cfn = JSONUtilities.readJson<$TSAny>(cfnPath);
  const taskDef = Object.values(cfn?.Resources) // get all the resources
    .find((value: $TSAny) => value?.Type === 'AWS::ECS::TaskDefinition') as any; // find the task definition
  const containerDefs = taskDef?.Properties?.ContainerDefinitions as any[]; // pull out just the container definitions
  if (!Array.isArray(containerDefs)) {
    return;
  }
  containerDefs
    .map(def => def?.Secrets) // get the secrets array
    .filter(secrets => !_.isEmpty(secrets)) // filter out defs that don't contain secrets
    .flat(1) // merge nested secrets array into one array
    .filter(secretDef => !!secretDef?.Name) // make sure the name is defined
    .filter(secretDef => !!secretDef.ValueFrom) // make sure the arn is defined
    .forEach(secretDef => secretsMap.set(secretDef.Name, secretDef.ValueFrom)); // add it to the secretsMap map
};
