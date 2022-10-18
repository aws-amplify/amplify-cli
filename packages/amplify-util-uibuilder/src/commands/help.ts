import { printer } from 'amplify-prompts';

/**
 * help command
 */
export const run = (): void => {
  printer.info('Supported commands: generateComponents, cloneComponentsFromEnv');
};
