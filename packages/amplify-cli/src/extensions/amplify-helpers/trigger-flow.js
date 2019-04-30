const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');
const { readdirSync, statSync, readFileSync } = require('fs');
const { copySync } = require('fs-extra');
const { flattenDeep } = require('lodash');
const { join } = require('path');

/**
 * @function triggerFlow
 * @param {object} context CLI context
 * @param {string} resource The provider (i.e. cognito)
 * @param {string} category The CLI category (i.e. amplify-category-auth)
 * @param {object} previousTriggers
 * @param {object} Object with current key/value pairs for triggers and templates
 * @returns {object} Object with current key/value pairs for triggers and templates
 */

const triggerFlow = async (context, resource, category, previousTriggers = {}) => {
  // handle missing params
  if (!resource) throw new Error('No resource provided to trigger question flow');
  if (!category) throw new Error('No resource provided to trigger question flow');

  // make sure resource is capitalized
  const resourceName = `${resource.charAt(0).toUpperCase()}${resource.slice(1)}`;

  // ask user if they want to manually configure triggers
  const wantTriggers = await inquirer.prompt({
    name: 'confirmation',
    type: 'confirm',
    message: `Do you want to configure Lambda Triggers for ${resourceName}?`,
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
    default: Object.keys(previousTriggers),
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
      default: flattenDeep(previousTriggers[askTriggers.triggers[i]]),
    };
    const askTemplates = await learnMoreLoop('templates', readableTrigger, templateMeta, templateQuestion);
    triggerObj[`${askTriggers.triggers[i]}`] = askTemplates.templates;
  }

  const tempTriggerObj = Object.assign({}, triggerObj);
  Object.values(tempTriggerObj).forEach((t, index) => {
    if (!t || t.length < 1) {
      delete triggerObj[Object.keys(triggerObj)[index]];
    }
  }, { triggerObj });
  return triggerObj;
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

async function openEditor(context, path, name) {
  const filePath = `${path}/${name}.js`;
  if (await context.amplify.confirmPrompt.run(`Do you want to edit your ${name} function now?`)) {
    await context.amplify.openEditor(context, filePath);
  }
}

// create triggers via lambda category
const createTrigger = async (
  category,
  parentCategory,
  parentResource,
  answers,
  context,
  previousTriggers,
) => {
  const { triggerCapabilities, resourceName } = answers;
  if (!triggerCapabilities || !resourceName) {
    throw Error('createTrigger function missing required parameters');
  }
  const keys = Object.keys(triggerCapabilities);
  const values = Object.values(triggerCapabilities);
  const targetDir = context.amplify.pathManager.getBackendDirPath();

  let triggerKeyValues = {};
  if (previousTriggers && Object.keys(previousTriggers).length > 0) {
    const previousKeys = Object.keys(previousTriggers);
    for (let y = 0; y < previousKeys.length; y += 1) {
      if (!keys || !keys.includes(previousKeys[y])) {
        const functionName = `${resourceName}${previousKeys[y]}`;
        const targetPath = `${targetDir}/function/${functionName}`;
        await deleteTrigger(context, functionName, targetPath);
      }
    }
  }
  if (triggerCapabilities) {
    for (let t = 0; t < keys.length; t += 1) {
      const functionName = `${resourceName}${keys[t]}`;
      const targetPath = `${targetDir}/function/${functionName}/src`;
      if (previousTriggers && previousTriggers[keys[t]]) {
        const updatedTrigger =
          await updateTrigger(category, targetPath, context, keys[t], values[t], functionName);
        triggerKeyValues = Object.assign(triggerKeyValues, updatedTrigger);
      } else {
        let add;
        try {
          ({ add } = require('amplify-category-function'));
        } catch (e) {
          throw new Error('Function plugin not installed in the CLI. You need to install it to use this feature.');
        }
        const modules = triggerCapabilities[keys[t]] ? triggerCapabilities[keys[t]].join() : '';
        await add(context, 'awscloudformation', 'Lambda', {
          modules,
          resourceName: functionName,
          functionName,
          roleName: functionName,
        });
        context.print.success('Succesfully added the Lambda function locally');
        for (let v = 0; v < values[t].length; v += 1) {
          await copyFunctions(keys[t], values[t][v], category, context, targetPath);
          triggerKeyValues[keys[t]] = functionName;
        }
      }
    }
  }
  return triggerKeyValues;
};

const deleteTrigger = async (context, name, dir) => {
  try {
    await context.amplify.forceRemoveResource(context, 'function', name, dir);
  } catch (e) {
    throw new Error('Function plugin not installed in the CLI. You need to install it to use this feature.');
  }
};

const updateTrigger = async (category, targetPath, context, key, values, functionName) => {
  const updatedTrigger = {};
  try {
    for (let v = 0; v < values.length; v += 1) {
      await copyFunctions(key, values[v], category, context, targetPath);
      context.amplify.updateamplifyMetaAfterResourceAdd(
        'function',
        functionName,
        {
          build: true,
          dependsOn: undefined,
          providerPlugin: 'awscloudformation',
          service: 'Lambda',
        },
      );
    }
    updatedTrigger[key] = functionName;
    return updatedTrigger;
  } catch (e) {
    throw new Error('Unable to copy lambda functions');
  }
};

const copyFunctions = async (key, values, category, context, targetPath) => {
  for (let c = 0; c < values.length; c += 1) {
    let source = '';
    if (values[c] === 'custom') {
      source = `${__dirname}/../../../../amplify-category-function/provider-utils/awscloudformation/function-template-dir/trigger-module.js`;
    } else {
      source = `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/${key}/${values[c]}.js`;
    }
    copySync(source, `${targetPath}/${values[c]}.js`);
    await openEditor(context, targetPath, values[c]);
  }
};


/**
 * @function
 * @param {array} triggers Currently triggers in CLI flow array of key/values
 *    @example ["{"TriggerName2":["template2"]}"]
 * @param {string} previous Serialized object of previously selected trigger values
 *    @example "{\"TriggerName1\":[\"template1\"]}"
 * @return {object} Object with current and previous triggers, with concatenated values for unions
 */
const parseTriggerSelections = (triggers, previous) => {
  const triggerObj = {};
  const previousTriggers = previous ? JSON.parse(previous) : null;
  const previousKeys = previousTriggers ? Object.keys(previousTriggers) : [];
  for (let i = 0; i < triggers.length; i += 1) {
    if (typeof triggers[i] === 'string') {
      triggers[i] = JSON.parse(triggers[i]);
    }
    const currentTrigger = Object.keys(triggers[i])[0];
    const currentValue = Object.values(triggers[i])[0];
    if (!triggerObj[currentTrigger]) {
      triggerObj[currentTrigger] = [...Object.values(triggers[i])];
    } else {
      triggerObj[currentTrigger] = triggerObj[currentTrigger]
        .concat(currentValue);
    }
    if (previousTriggers) {
      triggerObj[currentTrigger] = triggerObj[currentTrigger]
        .concat(...previousTriggers[currentTrigger]);
    }
  }
  for (let x = 0; x < previousKeys.length; x += 1) {
    triggerObj[previousKeys[x]] = previousTriggers[previousKeys[x]];
  }
  return triggerObj;
};


module.exports = { triggerFlow, createTrigger, parseTriggerSelections };
