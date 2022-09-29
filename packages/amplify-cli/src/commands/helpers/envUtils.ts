import { printer } from 'amplify-prompts';

/**
 * Print out the given environment metadata
 */
export const printEnvInfo = (envMeta: Record<string, unknown>): void => {
  printer.info('--------------');
  Object.entries(envMeta).forEach(([key, value]) => {
    if (typeof value === 'string') {
      printer.info(`${key}: ${value}`);
    }
  });
  printer.info('--------------');
  printer.blankLine();
};
