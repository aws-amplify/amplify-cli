import { printer } from 'amplify-prompts';

/**
 * Prints the environment info
 */
export const printEnvInfo = (env: string, allEnvs: object[]) : void => {
  printer.info('--------------');
  Object.keys(allEnvs[env])
    // eslint-disable-next-line spellcheck/spell-checker
    .filter(provider => provider !== 'nonCFNdata')
    .filter(provider => provider !== 'categories')
    .forEach(provider => {
      printer.info(`Provider: ${provider}`);

      Object.keys(allEnvs[env][provider]).forEach(providerAttr => {
        printer.info(`${providerAttr}: ${allEnvs[env][provider][providerAttr]}`);
      });

      printer.info('--------------');
      printer.blankLine();
    });
  printer.blankLine();
};
