const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

const subcommand = 'remove';
const category = 'hosting';

const pluginManifest = require('../../amplify-plugin.json');

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, input } = context;

    const inputResourceName = input.subCommands && input.subCommands.length > 0 ? input.subCommands[0] : undefined;
    const resourceName = await chooseResource(context, inputResourceName);

    if (resourceName) {
      try {
        await amplify.removeResource(context, category, resourceName);
      } catch (err) {
        context.print.info(err.stack);
        context.print.error('There was an error removing the hosting resource');
        context.usageData.emitError(err);
      }
    } else {
      process.exit(1);
    }
  },
};

async function chooseResource(context, inputResourceName) {
  let resourceName;
  const { amplify } = context;

  const { services, displayName } = pluginManifest;

  const amplifyMetaFilePath = amplify.pathManager.getAmplifyMetaFilePath();
  if (fs.existsSync(amplifyMetaFilePath)) {
    const amplifyMeta = amplify.readJsonFile(amplifyMetaFilePath);
    if (amplifyMeta[category] && Object.keys(amplifyMeta[category]).length > 0) {
      let enabledResources = Object.keys(amplifyMeta[category]);

      let inputIsValid = true;
      if (services && services.length > 0) {
        if (inputResourceName) {
          if (!services.includes(inputResourceName)) {
            context.print.error(`${inputResourceName} is not managed by the ${displayName} hosting plugin module.`);
            inputIsValid = false;
          } else if (!enabledResources.includes(inputResourceName)) {
            context.print.error(`${inputResourceName} has not been added.`);
            inputIsValid = false;
          }
        }

        enabledResources = enabledResources.filter(item => {
          return services.includes(item);
        });
      }

      if (inputIsValid) {
        if (inputResourceName) {
          resourceName = inputResourceName;
        } else if (enabledResources.length > 0) {
          const question = [
            {
              name: 'resource',
              type: 'list',
              message: 'Choose the resource you would want to remove',
              choices: enabledResources,
            },
          ];
          const answer = await inquirer.prompt(question);
          resourceName = answer.resource;
        } else {
          context.print.error(`You have not added any resources managed by the ${displayName} hosting plugin module.`);
        }
      }
    } else {
      context.print.error(`You have not added any resources in the hosting category.`);
    }
  }

  return resourceName;
}
