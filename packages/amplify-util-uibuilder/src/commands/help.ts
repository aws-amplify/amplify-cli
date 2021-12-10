import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

export async function run(context: $TSContext) {
  printer.info('Supported commands: generateComponents, cloneComponentsFromEnv');
}
