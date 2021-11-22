import { pathManager, readCFNTemplate, writeCFNTemplate, generateCustomPoliciesInTemplate } from 'amplify-cli-core';
import * as path from 'path';
import { ProviderName as providerName } from '../constants';
import { prePushCfnTemplateModifier } from './pre-push-cfn-modifier';

const buildDir = 'build';

/**
 * Runs transformations on a CFN template and returns a path to the transformed template
 *
 * Expects to be run in an initialized Amplify project
 * @param filePath the original template path
 * @returns The file path of the modified template
 */
export async function preProcessCFNTemplate(filePath: string): Promise<string> {
  const { templateFormat, cfnTemplate } = readCFNTemplate(filePath);

  await prePushCfnTemplateModifier(cfnTemplate);
  const backendDir = pathManager.getBackendDirPath();
  const pathSuffix = filePath.startsWith(backendDir) ? filePath.slice(backendDir.length) : path.parse(filePath).base;
  const newPath = path.join(backendDir, providerName, buildDir, pathSuffix);

  await writeCFNTemplate(cfnTemplate, newPath, { templateFormat });
  return newPath;
}

//get data from custom polcies file and write custom policies to CFN template
export async function writeCustomPoliciesToCFNTemplate(resourceName: string, service: string, cfnFile: string, category: string) {
  if (!(category === 'api' && service === 'ElasticContainer') && !(category === 'function' && service === 'Lambda')) {
    return;
  }

  const resourceDir = pathManager.getResourceDirectoryPath(undefined, category, resourceName);
  const cfnPath = path.join(resourceDir, cfnFile);
  const { templateFormat, cfnTemplate } = readCFNTemplate(cfnPath);
  const newCfnTemplate = generateCustomPoliciesInTemplate(cfnTemplate, resourceName, service, category);
  await writeCFNTemplate(newCfnTemplate, cfnPath, { templateFormat });
}
