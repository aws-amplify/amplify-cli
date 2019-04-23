const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');
const { readdirSync, readFileSync, statSync } = require('fs');
const { join } = require('path');

const triggerFlow = async (resource, category) => {
  const wantTriggers = await inquirer.prompt({
    name: 'confirmation',
    type: 'confirm',
    message: `Do you want to implement Lambda Triggers for ${resource}?`,
  });

  if (!wantTriggers.confirmation) {
    return null;
  }

  const res = [];

  if (!resource) throw new Error('No resource provided to trigger question flow');

  const triggerPath = `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/`;

  const triggerOptions = choicesFromMetadata(triggerPath, resource);
  const triggerQuestion = {
    name: 'triggers',
    type: 'checkbox',
    message: `Which triggers do you want to enable for ${resource}`,
    choices: triggerOptions,
  };

  let askTriggers = await inquirer.prompt(triggerQuestion);

  while (askTriggers.triggers.includes('learn')) {
    let prefix = `\nThe following triggers are available in ${resource}\n`;
    const metaData = getMetadata(triggerPath, resource);
    Object.values(metaData).forEach((m) => {
      prefix = prefix.concat('\n');
      prefix = prefix.concat(`${chalkpipe(null, chalk.green)('\nName:')} ${m.name}${chalkpipe(null, chalk.green)('\nDescription:')} ${m.description}\n`);
      prefix = prefix.concat('\n');
    });
    triggerQuestion.prefix = prefix;
    askTriggers = await inquirer.prompt(triggerQuestion);
  }

  const learnIndex = askTriggers.triggers.indexOf('learn');
  if (learnIndex !== -1) {
    askTriggers.triggers.splice(learnIndex, 1);
  }

  const triggerObj = {};

  for (let i = 0; i < askTriggers.triggers.length; i++) {
    const optionsPath = `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/${askTriggers.triggers[i]}`;

    const templateOptions = choicesFromMetadata(optionsPath, askTriggers.triggers[i]);

    const askTemplates = await inquirer.prompt({
      name: 'template',
      type: 'list',
      message: `Which templates do you want to use for ${resource}`,
      choices: templateOptions,
    });
    triggerObj[`${askTriggers.triggers[i]}`] = askTemplates.template;
    res.push(triggerObj);
  }

  return res;
};

const choicesFromMetadata = (path, selection) => {
  const templates = readdirSync(path)
    .filter(f => statSync(join(path, f)).isDirectory());

  const metaData = getMetadata(path, selection);

  const configuredOptions = Object.keys(metaData).filter(k => templates.includes(k));

  const options = configuredOptions.map((c) => {
    return {
      name: `${metaData[c].name}`,
      value: c,
    };
  });
  options.unshift(new inquirer.Separator());
  options.unshift({ name: 'Learn More', value: 'learn' });
  return options;
};

const getMetadata = (path, selection) => JSON.parse(readFileSync(`${path}/${selection}.map.json`));

const createTrigger = async (category, triggers, context, resourceName) => {
  const triggerKeyValues = {};
  if (triggers) {
    const keys = Object.keys(triggers);
    const values = Object.values(triggers);
    for (let t = 0; t < keys.length; t += 1) {
      let add;
      try {
        ({ add } = require('amplify-category-function'));
      } catch (e) {
        throw new Error('Function plugin not installed in the CLI. You need to install it to use this feature.');
      }
      context.pendingCognitoTrigger = {
        functionName: `${resourceName}${keys[t]}`,
        resourceName: `${resourceName}${keys[t]}`,
        triggerResource: 'cognito',
        cliCategory: category,
        triggerCategory: keys[t],
        functionTemplate: values[t],
      };
      const res = await add(context, 'awscloudformation', 'Lambda');
      context.print.success('Succesfully added the Lambda function locally');
      triggerKeyValues[keys[t]] = `${resourceName}${keys[t]}`;
      // add(context, 'awscloudformation', 'Lambda')
      //   .then(() => {
      //     context.print.success('Succesfully added the Lambda function locally');
      //     triggerKeyValues[keys[t]] = `${resourceName}-${keys[t]}`;
      //   });
    }
  }
  return triggerKeyValues;
};

module.exports = { triggerFlow, createTrigger };
