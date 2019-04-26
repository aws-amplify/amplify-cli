const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');
const { readdirSync, statSync, readFileSync } = require('fs');
const { copySync } = require('fs-extra');
const { join } = require('path');

const triggerFlow = async (context, resource, category) => {
  // handle missing params
  if (!resource) throw new Error('No resource provided to trigger question flow');
  if (!category) throw new Error('No resource provided to trigger question flow');

  // instantiate response array
  const res = [];

  // make sure resource is capitalized
  const resourceName = `${resource.charAt(0).toUpperCase()}${resource.slice(1)}`;

  // ask user if they want to manually configure triggers
  const wantTriggers = await inquirer.prompt({
    name: 'confirmation',
    type: 'confirm',
    message: `Do you want to implement Lambda Triggers for ${resourceName}?`,
  });

  // if user does not want to manually configure triggers, return null
  if (!wantTriggers.confirmation) {
    return null;
  }

  // path to trigger directory in category
  const triggerPath = `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/`;

  // get available triggers
  const triggerOptions = choicesFromMetadata(triggerPath, resource, true);

  // instantiate trigger question
  const triggerQuestion = {
    name: 'triggers',
    type: 'checkbox',
    message: `Which triggers do you want to enable for ${resourceName}`,
    choices: triggerOptions,
  };

  // get trigger metadata
  const triggerMeta = getMetadata(triggerPath, resource);

  // ask triggers question via learn more loop
  const askTriggers = await learnMoreLoop('triggers', resourceName, triggerMeta, triggerQuestion);

  // instantiate triggerObj
  const triggerObj = {};

  // loop through triggers that user selected,
  // and ask which templates they want using template metadata and learn more loop
  for (let i = 0; i < askTriggers.triggers.length; i++) {
    const optionsPath = `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/${askTriggers.triggers[i]}`;

    const templateOptions = choicesFromMetadata(optionsPath, askTriggers.triggers[i]);
    templateOptions.push({ name: 'Create your own module', value: 'custom' });
    const templateMeta = getMetadata(optionsPath, askTriggers.triggers[i]);
    const readableTrigger = triggerMeta[askTriggers.triggers[i]].name;

    const templateQuestion = {
      name: 'templates',
      type: 'checkbox',
      message: `What functionality do you want to use for ${readableTrigger}`,
      choices: templateOptions,
    };
    const askTemplates = await learnMoreLoop('templates', readableTrigger, templateMeta, templateQuestion);
    triggerObj[`${askTriggers.triggers[i]}`] = askTemplates.templates;
    res.push(triggerObj);
  }

  return res;
};

// learn more question loop
const learnMoreLoop = async (key, map, metaData, question) => {
  let selections = await inquirer.prompt(question);

  while (
    // handle answers that are strings or arrays
    (Array.isArray(selections[key]) && selections[key].includes('learn'))
  ) {
    let prefix;
    if (metaData.URL) {
      prefix = `\nAdditional information about the ${key} available for ${map} can be found here: ${chalkpipe(null, chalk.blue.underline)(metaData.URL)}\n`;
      prefix = prefix.concat('\n');
    } else {
      prefix = `\nThe following ${key} are available in ${map}\n`;
      Object.values(metaData).forEach((m) => {
        prefix = prefix.concat('\n');
        prefix = prefix.concat(`${chalkpipe(null, chalk.green)('\nName:')} ${m.name}${chalkpipe(null, chalk.green)('\nDescription:')} ${m.description}\n`);
        prefix = prefix.concat('\n');
      });
    }
    question.prefix = prefix;
    selections = await inquirer.prompt(question);
  }
  return selections;
};

// extract question choices from metadata
const choicesFromMetadata = (path, selection, isDir) => {
  const templates = isDir ?
    readdirSync(path)
      .filter(f => statSync(join(path, f)).isDirectory()) :
    readdirSync(path).map(t => t.substring(0, t.length - 3));

  const metaData = getMetadata(path, selection);
  const configuredOptions = Object.keys(metaData).filter(k => templates.includes(k));
  const options = configuredOptions.map(c => ({ name: `${metaData[c].name}`, value: c }));
  // add learn more w/ seperator
  options.unshift(new inquirer.Separator());
  options.unshift({ name: 'Learn More', value: 'learn' });
  return options;
};

const getMetadata = (path, selection) => JSON.parse(readFileSync(`${path}/${selection}.map.json`));

async function openEditor(context, path) {
  if (await context.amplify.confirmPrompt.run('Do you want to edit your custom module now?')) {
    await context.amplify.openEditor(context, path);
  }
}

// create triggers via lambda category
const createTrigger = async (category, triggers, context, resourceName) => {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
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
      };
      await add(context, 'awscloudformation', 'Lambda');
      context.print.success('Succesfully added the Lambda function locally');
      const targetPath = `${targetDir}/function/${resourceName}${keys[t]}/src`;
      for (let v = 0; v < values[t].length; v += 1) {
        let source = '';
        if (values[t][v] === 'custom') {
          source = `${__dirname}/../../../../amplify-category-function/provider-utils/awscloudformation/function-template-dir/trigger-module.js`;
        } else {
          source = `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/${keys[t]}/${values[t][v]}.js`;
        }
        copySync(source, `${targetPath}/${values[t][v]}.js`);
        await openEditor(context, targetPath);
        triggerKeyValues[keys[t]] = `${resourceName}${keys[t]}`;
      }
    }
  }
  return triggerKeyValues;
};

module.exports = { triggerFlow, createTrigger };
