import {
  $TSContext,
  AmplifyError,
  AmplifyErrorType,
  AmplifyException,
  FeatureFlags,
  IAmplifyResource,
  JSONUtilities,
  pathManager,
} from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
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
export const transformResourceWithOverrides = async (context: $TSContext, resource?: IAmplifyResource): Promise<void> => {
  let spinner: ora.Ora;

  try {
    if (resource) {
      const pluginInfo = context.amplify.getCategoryPluginInfo(context, resource.category, resource.resourceName);
      const { transformCategoryStack } = pluginInfo ? await import(pluginInfo.packageLocation) : { transformCategoryStack: null };

      if (transformCategoryStack) {
        spinner = ora(`Building resource ${resource.category}/${resource.resourceName}`);
        spinner.start();
        await transformCategoryStack(context, resource);
        await FeatureFlags.ensureFeatureFlag('project', 'overrides');
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
    // check for these specific Amplify Override/Custom Stack Errors,
    // because we want the customer to fix invalid overrides or custom stack errors
    // before deployments
    const overrideOrCustomStackErrorsList: AmplifyErrorType[] = [
      'MissingOverridesInstallationRequirementsError',
      'InvalidOverrideError',
      'InvalidCustomResourceError',
      'ScriptingFeaturesDisabledError',
    ];
    if (
      (err instanceof AmplifyException && overrideOrCustomStackErrorsList.find((v) => v === err.name)) ||
      // this is a special exception for the API category which would otherwise have a
      // circular dependency if it imported AmplifyException
      err['_amplifyErrorType'] === 'InvalidOverrideError'
    ) {
      // if the exception is not already an AmplifyException re-throw it as an AmplifyException
      // so that user's get the appropriate resolution steps that we intended
      if (err['_amplifyErrorType'] === 'InvalidOverrideError') {
        throw new AmplifyError(
          'InvalidOverrideError',
          {
            message: `Executing overrides failed.`,
            details: err.message,
            resolution: 'There may be runtime errors in your overrides file. If so, fix the errors and try again.',
          },
          err,
        );
      }
      // otherwise just rethrow the AmplifyException
      throw err;
    }

    // Ignore other errors that were previously being ignored,
    // such as GraphQL/Auth errors even if they are AmplifyExceptions.
    // The CLI will trigger corrective walkthroughs/flows for those errors,
    // such as in amplify-helpers/push-resources.ts.
  } finally {
    if (spinner) {
      spinner.stop();
    }
  }
};
