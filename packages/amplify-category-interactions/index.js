const category = 'interactions';

async function migrate(context) {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises = [];
  Object.keys(amplifyMeta).forEach((categoryName) => {
    if (categoryName === category) {
      Object.keys(amplifyMeta[category]).forEach((resourceName) => {
        try {
          const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
          if (providerController) {
            migrateResourcePromises.push(providerController.migrateResource(
              context,
              projectPath,
              amplifyMeta[category][resourceName].service,
              resourceName,
            ));
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
  migrate,
};
