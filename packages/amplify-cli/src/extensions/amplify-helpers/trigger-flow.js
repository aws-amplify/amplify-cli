const inquirer = require('inquirer');
const { readdirSync, readFileSync, statSync } = require('fs');
const { join } = require('path');

const triggerFlow = async (resource) => {
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

  const triggerPath = `${__dirname}/../../../../amplify-category-function/provider-utils/awscloudformation/function-template-dir/triggers/${resource}`;

  const triggerOptions = choicesFromMetadata(triggerPath, resource);

  const askTriggers = await inquirer.prompt({
    name: 'triggers',
    type: 'checkbox',
    message: `Which triggers do you want to enable for ${resource}`,
    choices: triggerOptions,
  });

  for (let i = 0; i < askTriggers.triggers.length; i++) {
    const optionsPath = `${__dirname}/../../../../amplify-category-function/provider-utils/awscloudformation/function-template-dir/triggers/${resource}/${askTriggers.triggers[i]}`;

    const templateOptions = choicesFromMetadata(optionsPath, askTriggers.triggers[i]);

    const askTemplates = await inquirer.prompt({
      name: 'template',
      type: 'list',
      message: `Which templates do you want to use for ${resource}`,
      choices: templateOptions,
    });
    const triggerObj = {
      name: askTriggers.triggers[i],
      template: askTemplates.template,
    };
    res.push(triggerObj);
  }

  return res;
};

const choicesFromMetadata = (path, selection) => {

  const templates = readdirSync(path)
    .filter(f => statSync(join(path, f)).isDirectory());

  const metaData = JSON.parse(readFileSync(`${path}/${selection}.map.json`));

  const configuredOptions = Object.keys(metaData).filter(k => templates.includes(k));

  const options = configuredOptions.map((c) => {
    return {
      name: `${metaData[c].name}: ${metaData[c].description}`,
      value: c,
    };
  });
  return options;
};

module.exports = { triggerFlow };
