import { $TSContext } from 'amplify-cli-core';

export async function run(context: $TSContext) {
  context.print.info('Supported commands: generateComponents, cloneComponentsFromEnv');
}
