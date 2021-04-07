import { pathManager, readCFNTemplate, writeCFNTemplate } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ProviderName as providerName } from '../constants';
import { prePushCfnTemplateModifier } from './pre-push-cfn-modifier';

const buildDir = 'build';

/**
 * Runs transformations on a CFN template and returns a path to the transformed template
 * @param filePath the original template path (expects a path within the Amplify backend directory)
 * @returns The file path of the modified template
 */
export async function preProcessCFNTemplate(filePath: string): Promise<string> {
  const pathPrefix = pathManager.getBackendDirPath();
  if (!filePath.startsWith(pathPrefix)) {
    throw new Error(`Expected ${filePath} to be under ${pathPrefix}`);
  }
  const { templateFormat, cfnTemplate } = await readCFNTemplate(filePath);

  await prePushCfnTemplateModifier(cfnTemplate);

  // ensure the destination exists
  const pathSuffix = filePath.slice(pathPrefix.length);
  const parsedSuffix = path.parse(pathSuffix);
  const destDir = path.join(pathPrefix, providerName, buildDir, parsedSuffix.dir);
  const destFilename = parsedSuffix.base;
  await fs.ensureDir(destDir);
  const newPath = path.join(destDir, destFilename);

  await writeCFNTemplate(cfnTemplate, newPath, { templateFormat });
  return newPath;
}
