const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const pathManager = require('./path-manager');

function removeResource(context, category) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));

  if (!amplifyMeta[category] || Object.keys(amplifyMeta[category]).length === 0) {
    context.print.error('No resources added for this category');
    process.exit(1);
    return;
  }

  const resources = Object.keys(amplifyMeta[category]);

  const question = [{
    name: 'resource',
    message: 'Choose the resource you would want to remove',
    type: 'list',
    choices: resources,
  }];

  return inquirer.prompt(question)
    .then((answer) => {
      const resourceName = answer.resource;
      const resourceDir = path.normalize(path.join(
        pathManager.getBackendDirPath(),
        category,
        resourceName,
      ));
      return context.amplify.confirmPrompt.run('Are you sure you want to delete the resource? This action deletes all files related to this resource from the backend directory.')
        .then(async (confirm) => {
          if (confirm) {
            const { allResources } = await context.amplify.getResourceStatus();
            allResources.forEach((resourceItem) => {
              if (resourceItem.dependsOn) {
                resourceItem.dependsOn.forEach((dependsOnItem) => {
                  if (dependsOnItem.category === category &&
                      dependsOnItem.resourceName === resourceName) {
                    context.print.error('Resource cannot be removed because it has a dependency on another resource');
                    context.print.error(`Dependency: ${resourceItem.service}:${resourceItem.resourceName}`);
                    throw new Error('Resource cannot be removed because it has a dependency on another resource');
                  }
                });
              }
            });
            const resourceValues = {
              service: amplifyMeta[category][resourceName].service,
              resourceName,
            };
            if (amplifyMeta[category][resourceName] !== undefined) {
              delete amplifyMeta[category][resourceName];
            }

            const jsonString = JSON.stringify(amplifyMeta, null, '\t');
            fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

            // Remove resource directory from backend/
            context.filesystem.remove(resourceDir);

            context.print.success('Successfully removed resource');
            return resourceValues;
          }
        });
    })
    .catch((err) => {
      context.print.info(err.stack);
      context.print.error('An error occurred when removing the resources from the local directory');
    });
}

module.exports = {
  removeResource,
};
