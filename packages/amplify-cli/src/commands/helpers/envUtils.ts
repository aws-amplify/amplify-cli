export function printEnvInfo(context: any, env: string, allEnvs: object[]) {
  context.print.info('--------------');
  Object.keys(allEnvs[env])
    .filter(provider => provider !== 'nonCFNdata')
    .filter(provider => provider !== 'categories')
    .forEach(provider => {
      context.print.info(`Provider: ${provider}`);

      Object.keys(allEnvs[env][provider]).forEach(providerAttr => {
        context.print.info(`${providerAttr}: ${allEnvs[env][provider][providerAttr]}`);
      });

      context.print.info('--------------');
      context.print.info('');
    });
  context.print.info('');
}
