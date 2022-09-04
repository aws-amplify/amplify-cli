import {
  $TSContext, FeatureFlags, IAmplifyResource, JSONUtilities, pathManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import ora from 'ora';
import * as path from 'path';
import { transformRootStack } from '.';
import { prePushCfnTemplateModifier } from '../pre-push-cfn-processor/pre-push-cfn-modifier';
import { rootStackFileName } from '../push-resources';
import { isMigrateProject, isRootOverrideFileModifiedSinceLastPush } from './root-stack-utils';

/**
 *
 * @param context
 * @returns
 */
export async function transformResourceWithOverrides(context: $TSContext, resource?: IAmplifyResource) {
  const flags = context.parameters.options;
  let spinner: ora.Ora;

  try {
    if (resource) {
      const pluginInfo = context.amplify.getCategoryPluginInfo(context, resource.category, resource.resourceName);
      const { transformCategoryStack } = pluginInfo ? await import(pluginInfo.packageLocation) : { transformCategoryStack: null };

      if (transformCategoryStack) {
        spinner = ora(`Building resource ${resource.category}/${resource.resourceName}`);
        spinner.start();
        await transformCategoryStack(context, resource);
        FeatureFlags.ensureFeatureFlag('project', 'overrides');
        spinner.stop();
        return;
      }
      printer.debug('Overrides functionality is not implemented for this category');
    } else {
      // old app -> migrate project must transform -> change detected
      // new app -> just initialized project no transform -> no change detected
      // new app -> just pushed project {
      //  overrides enabled : transform -> change detected
      //  override disabled : no transform -> No change detected
      // }

      // RootStack deployed to backend/awscloudformation/build
      const projectRoot = pathManager.findProjectRoot();
      const rootStackBackendBuildDir = pathManager.getRootStackBuildDirPath(projectRoot);
      fs.ensureDirSync(rootStackBackendBuildDir);
      const rootStackBackendFilePath = path.join(rootStackBackendBuildDir, rootStackFileName);
      if (isMigrateProject()) {
        // old App
        const template = await transformRootStack(context);
        await prePushCfnTemplateModifier(template);
        JSONUtilities.writeJson(rootStackBackendFilePath, template);
      } else if (isRootOverrideFileModifiedSinceLastPush()) {
        // new App before push
        const template = await transformRootStack(context);
        await prePushCfnTemplateModifier(template);
        JSONUtilities.writeJson(rootStackBackendFilePath, template);
      }
    }
  } catch (err) {
    if (spinner) {
      spinner.stop();
    }
  }
}
