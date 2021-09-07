import { CommandType } from '../root-stack-builder';
import { $TSContext, IAmplifyResource } from 'amplify-cli-core';
import { AmplifyCategoryTransformFactory } from './amplify-factory-transform';
import { transformRootStack } from '.';
/**
 *
 * @param context
 * @returns
 */
export async function transformCfnWithOverrides(context: $TSContext, resource: IAmplifyResource) {
  const flags = context.parameters.options;
  if (flags['no-override']) {
    return;
  }

  await AmplifyCategoryTransformFactory.getCategoryTransformInstance({
    category: resource.category,
    resourceName: resource.resourceName,
    service: resource.service,
  }).transform(context);

  //TODO: Remove Command
  await transformRootStack(CommandType.PUSH);
}
