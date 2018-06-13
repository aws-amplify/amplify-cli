const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const pathManager = require('./path-manager');

function removeResource(context, category) {
  const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
  const awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));

  if (!awsmobileMeta[category] || Object.keys(awsmobileMeta[category]).length === 0) {
    context.print.error('No resources added for this category');
    process.exit(1);
    return;
  }

  const resources = Object.keys(awsmobileMeta[category]);

  const question = [{
    name: 'resource',
    message: 'Please select the resource you would want to remove',
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
      return context.prompt.confirm('Are you sure you want to delete the resource? This would delete all corresponding files related to this resource from the backend directory.')
        .then((confirm) => {
          if (confirm) {
            return new Promise((resolve) => {
              if (awsmobileMeta[category][resourceName] !== undefined) {
                delete awsmobileMeta[category][resourceName];
              }

              const jsonString = JSON.stringify(awsmobileMeta, null, '\t');
              fs.writeFileSync(awsmobileMetaFilePath, jsonString, 'utf8');

              // Remove resource directory from backend/
              context.filesystem.remove(resourceDir);

              resolve();
            });
          }
          process.exit(1);
        })
        .then(() => context.print.success('Successfully removed resource'));
    })
    .catch((err) => {
      context.print.info(err.stack);
      context.print.error('There was an issue removing the resources from the local directory');
    });
}

module.exports = {
  removeResource,
};
