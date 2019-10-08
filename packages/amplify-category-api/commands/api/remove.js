const path = require('path');

const subcommand = 'remove';
const category = 'api';
const gqlConfigFilename = '.graphqlconfig.yml';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify
      .removeResource(context, category, resourceName)
      .then(resourceValues => {
        if (resourceValues.service === 'AppSync') {
          const { projectPath } = amplify.getEnvInfo();

          const gqlConfigFile = path.normalize(path.join(projectPath, gqlConfigFilename));
          context.filesystem.remove(gqlConfigFile);
        }
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('There was an error removing the api resource');
      });
  },
};
