import { pathManager, readCFNTemplate, writeCFNTemplate } from 'amplify-cli-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ProviderName as providerName } from '../constants';
import { prePushCfnTemplateModifier } from './pre-push-cfn-modifier';

const buildDir = 'build';

/**
 * Runs transformations on a CFN template and returns a path to the transformed template
 * @param filePath the original template path (expects a path within the Amplify backend directory)
 * @returns The file path of the modified template
 */
export async function preProcessCFNTemplate(filePath: string): Promise<string> {
  const { templateFormat, cfnTemplate } = await readCFNTemplate(filePath);

  await prePushCfnTemplateModifier(cfnTemplate);

  const backendDir = pathManager.getBackendDirPath();
  const pathSuffix = filePath.startsWith(backendDir) ? filePath.slice(backendDir.length) : path.parse(filePath).base;
  const newPath = path.join(backendDir, providerName, buildDir, pathSuffix);
  await fs.ensureDir(path.parse(newPath).dir);

  await writeCFNTemplate(cfnTemplate, newPath, { templateFormat });
  return newPath;
}
