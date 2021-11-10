import { $TSContext, IAmplifyResource, JSONUtilities, pathManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import * as path from 'path';
import { transformRootStack } from '.';
import { prePushCfnTemplateModifier } from '../pre-push-cfn-processor/pre-push-cfn-modifier';
import { rootStackFileName } from '../push-resources';

/**
 *
 * @param context
 * @returns
 */
export async function transformResourceWithOverrides(context: $TSContext, resource?: IAmplifyResource) {
  const flags = context.parameters.options;
  try {
    if (resource) {
      const { transformCategoryStack } = await import(`@aws-amplify/amplify-category-${resource.category}`);
      if (transformCategoryStack) {
        return await transformCategoryStack(context, resource);
      } else {
        printer.info('Overrides functionality is not impleented for this category');
      }
    } else {
      const template = await transformRootStack(context);
      await prePushCfnTemplateModifier(template);
      // RootStack deployed to backend/awscloudformation/build
      const projectRoot = pathManager.findProjectRoot();
      const rootStackBackendBuildDir = pathManager.getRootStackBuildDirPath(projectRoot);
      fs.ensureDirSync(rootStackBackendBuildDir);
      const rootStackBackendFilePath = path.join(rootStackBackendBuildDir, rootStackFileName);
      JSONUtilities.writeJson(rootStackBackendFilePath, template);
    }
  } catch (err) {
    return;
  }
}
