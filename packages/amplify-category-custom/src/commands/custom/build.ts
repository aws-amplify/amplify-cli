import { $TSContext } from 'amplify-cli-core';
import { buildCustomResources } from '../../utils/build-custom-resources';

export const name = 'build';

export async function run(context: $TSContext) {
  const { parameters } = context;
  const resourceName = parameters.first;

  await buildCustomResources(context, resourceName);
}
