import { $TSContext, FeatureFlags, IAmplifyResource } from 'amplify-cli-core';
//import { transformRootStack } from '.';
import { printer } from 'amplify-prompts';
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
  if (resource && FeatureFlags.getBoolean(`overrides.${resource.category}`)) {
    try {
      // Each Category will implement transformCategoryStack function to start transformation process
      const { transformCategoryStack } = await import(`@aws-amplify/amplify-category-${resource.category}`);
      if (transformCategoryStack) {
        return transformCategoryStack(context, resource);
      } else {
        printer.info('Overrides functionality is not impleented for this category');
      }
    } catch (err) {
      return;
    }
  } else {
    if (FeatureFlags.getBoolean('overrides.project')) {
      //await transformRootStack(context);
    }
  }
}
