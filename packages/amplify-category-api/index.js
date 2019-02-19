const { run } = require('./commands/api/console');

const category = 'api';


async function console(context) {
  await run(context);
}

async function migrate(context, serviceName) {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises = [];
  Object.keys(amplifyMeta).forEach((categoryName) => {
    if (categoryName === category) {
      Object.keys(amplifyMeta[category]).forEach((resourceName) => {
        try {
          const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
          if (providerController) {
            if (!serviceName || serviceName === amplifyMeta[category][resourceName].service) {
              migrateResourcePromises.push(providerController.migrateResource(
                context,
                projectPath,
                amplifyMeta[category][resourceName].service,
                resourceName,
              ));
            }
          } else {
            context.print.error(`Provider not configured for ${category}: ${resourceName}`);
          }
        } catch (e) {
          context.print.warning(`Could not run migration for ${category}: ${resourceName}`);
          throw e;
        }
      });
    }
  });

  await Promise.all(migrateResourcePromises);
}

module.exports = {
  console,
  migrate,
};
