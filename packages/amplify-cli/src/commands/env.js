const path = require('path');

const featureName = 'env';
module.exports = {
  name: featureName,
  run: async context => {
    const { subCommands } = context.input;
    let subcommand = 'help';
    if (subCommands && subCommands.length > 0) {
      /* eslint-disable */
      subcommand = subCommands[0];
      /* eslint-enable */
    }
    shiftParams(context);
    if (subcommand === 'help') {
      displayHelp(context);
    } else {
      let commandModule;

      try {
        commandModule = require(path.normalize(path.join(__dirname, 'env', subcommand)));
      } catch (e) {
        displayHelp(context);
      }

      if (commandModule) {
        await commandModule.run(context);
      }
    }
  },
};

function shiftParams(context) {
  delete context.parameters.first;
  delete context.parameters.second;
  delete context.parameters.third;
  const { subCommands } = context.input;
  /* eslint-disable */
  if (subCommands && subCommands.length > 1) {
    if (subCommands.length > 1) {
      context.parameters.first = subCommands[1];
    }
    if (subCommands.length > 2) {
      context.parameters.second = subCommands[2];
    }
    if (subCommands.length > 3) {
      context.parameters.third = subCommands[3];
    }
  }
  /* eslint-enable */
}

function displayHelp(context) {
  const header = `amplify ${featureName} <subcommands>`;

  const commands = [
    {
      name: 'add',
      description: 'Adds a new environment to your Amplify Project',
    },
    {
      name: 'pull [--restore]',
      description:
        'Pulls your environment with the current cloud environment. Use the restore flag to overwrite your local backend configs with that of the cloud.',
    },
    {
      name: 'checkout <env-name> [--restore]',
      description:
        'Moves your environment to the environment specified in the command. Use the restore flag to overwrite your local backend configs with the backend configs of the environment specified.',
    },
    {
      name: 'list [--details] [--json]',
      description: 'Displays a list of all the environments in your Amplify project',
    },
    {
      name: 'get --name <env-name> [--json]',
      description: 'Displays the details of the environment specified in the command',
    },
    {
      name: 'import --name <env-name> --config <provider-configs> [--awsInfo <aws-configs>]',
      description: 'Imports an already existing Amplify project environment stack to your local backend',
    },
    {
      name: 'remove <env-name>',
      description: 'Removes an environment from the Amplify project',
    },
  ];

  context.amplify.showHelp(header, commands);
  context.print.info('');
}
