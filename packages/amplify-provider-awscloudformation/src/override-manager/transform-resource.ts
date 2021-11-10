import { $TSContext, FeatureFlags, IAmplifyResource, JSONUtilities, pathManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { transformRootStack } from '.';
import * as fs from 'fs-extra';
import { prePushCfnTemplateModifier } from '../pre-push-cfn-processor/pre-push-cfn-modifier';
import * as path from 'path';
import { rootStackFileName } from '../push-resources';
import { storeRootStackTemplate } from '../initializer';
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
      if (FeatureFlags.getBoolean('overrides.project')) {
        await storeRootStackTemplate(context);
      }
    }
  } catch (err) {
    return;
  }
}
