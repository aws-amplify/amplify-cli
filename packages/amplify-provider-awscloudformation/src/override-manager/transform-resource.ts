import { $TSContext, FeatureFlags, IAmplifyResource } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { transformRootStack } from '.';
/**
 *
 * @param context
 * @returns
 */
export async function transformResourceWithOverrides(context: $TSContext, resource?: IAmplifyResource) {
  const flags = context.parameters.options;
  if (flags['no-override']) {
    return;
  }
  try {
    if (resource) {
      const { transformCategoryStack } = await import(`@aws-amplify/amplify-category-${resource.category}`);
      if (transformCategoryStack) {
        return transformCategoryStack(context, resource);
      } else {
        printer.info('Overrides functionality is not impleented for this category');
      }
    } else {
      if (FeatureFlags.getBoolean('overrides.project')) {
        await transformRootStack(context);
      }
    }
  } catch (err) {
    return;
  }
}
