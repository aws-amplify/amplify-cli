const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');
const { readdirSync, statSync, readFileSync } = require('fs');
const { copySync } = require('fs-extra');
const { flattenDeep, uniq } = require('lodash');
const { join } = require('path');

/**
 * @function triggerFlow
 * @param {object} context CLI context
 * @param {string} resource The provider (i.e. cognito)
 * @param {string} category The CLI category (i.e. amplify-category-auth)
 * @param {object} previousTriggers Object representing already configured triggers
 *  @example {"PostConfirmation":["add-to-group"]}
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
  const triggerMeta = getTriggerMetadata(triggerPath, resource);

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
    const templateMeta = getTriggerMetadata(optionsPath, askTriggers.triggers[i]);
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

/**
 * @function createTrigger
 * @param {string} category
 * @param {string} parentCategory
 * @param {string} parentResource
 * @param {object} options
 * @param {object} context The CLI Context
 * @param {object} previousTriggers
 * @returns {object} keys/value pairs of trigger: resource name
 */
const createTrigger = async (
  category,
  parentCategory,
  parentResource,
  options,
  context,
  previousTriggers,
) => {
  if (!options) {
    return new Error('createTrigger function missing option parameter');
  }
  const {
    triggerCapabilities,
    resourceName,
    deleteAll,
    triggerEnvs,
  } = options;
  const targetDir = context.amplify.pathManager.getBackendDirPath();

  // if deleteAll is true, we delete all resources and immediately return
  if (deleteAll) {
    const previousKeys = Object.keys(previousTriggers);
    for (let y = 0; y < previousKeys.length; y += 1) {
      const functionName = `${resourceName}${previousKeys[y]}`;
      const targetPath = `${targetDir}/function/${functionName}`;
      await deleteTrigger(context, functionName, targetPath);
    }
    return {};
  }

  // handle missing parameters
  if (!triggerCapabilities || !resourceName) {
    return new Error('createTrigger function missing required parameters');
  }

  // creating array of trigger names
  const keys = Object.keys(triggerCapabilities);

  // creating array of previously configured trigger names
  const previousKeys = previousTriggers ? Object.keys(previousTriggers) : [];

  // creating array of trigger values
  const values = Object.values(triggerCapabilities);

  let triggerKeyValues = {};
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
          triggerEnvs: JSON.stringify(triggerEnvs[keys[t]]),
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

  // loop through previous triggers to find those that are not in the current triggers, and delete
  for (let p = 0; p < previousKeys.length; p += 1) {
    if (!keys.includes(previousKeys[p])) {
      const functionName = `${resourceName}${previousKeys[p]}`;
      const targetPath = `${targetDir}/function/${functionName}`;
      await deleteTrigger(context, functionName, targetPath);
    }
  }
  return triggerKeyValues;
};

/**
 * @function getTriggerPermissions
 * @param {object} context CLI context
 * @param {string} triggers Serialized trigger object
 * @param {string} category The CLI category (i.e. amplify-category-auth)
 * @returns {array} Array of serialized permissions objects
 * @example ["{
 *    "policyName": "AddToGroup",
 *    "trigger": "PostConfirmation",
 *    "actions": ["cognito-idp:AdminAddUserToGroup"],
 *    "resources": [
 *      {
 *        "type": "UserPool",
 *        "attribute": "Arn"
 *      }
 *    ]
 *  }"]
 */
const getTriggerPermissions = (context, triggers, category) => {
  const permissions = [];
  const parsedTriggers = JSON.parse(triggers);
  const triggerKeys = Object.keys(parsedTriggers);
  triggerKeys.forEach((k) => {
    const meta = context.amplify.getTriggerMetadata(
      `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/${k}`,
      k,
    );
    parsedTriggers[k].forEach((t) => {
      if (meta[t] && meta[t].permissions) {
        permissions.push(JSON.stringify(meta[t].permissions));
      }
    });
  });
  return permissions;
};


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

const choicesFromMetadata = (path, selection, isDir) => {
  const templates = isDir ?
    readdirSync(path)
      .filter(f => statSync(join(path, f)).isDirectory()) :
    readdirSync(path).map(t => t.substring(0, t.length - 3));

  const metaData = getTriggerMetadata(path, selection);
  const configuredOptions = Object.keys(metaData).filter(k => templates.includes(k));
  const options = configuredOptions.map(c => ({ name: `${metaData[c].name}`, value: c }));
  // add learn more w/ seperator
  options.unshift(new inquirer.Separator());
  options.unshift({ name: 'Learn More', value: 'learn' });
  return options;
};

const getTriggerMetadata = (path, selection) => JSON.parse(readFileSync(`${path}/${selection}.map.json`));

async function openEditor(context, path, name) {
  const filePath = `${path}/${name}.js`;
  if (await context.amplify.confirmPrompt.run(`Do you want to edit your ${name} function now?`)) {
    await context.amplify.openEditor(context, filePath);
  }
}

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

const copyFunctions = async (key, value, category, context, targetPath) => {
  const dirContents = readdirSync(targetPath);
  if (!dirContents.includes(`${value}.js`)) {
    let source = '';
    if (value === 'custom') {
      source = `${__dirname}/../../../../amplify-category-function/provider-utils/awscloudformation/function-template-dir/trigger-module.js`;
    } else {
      source = `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/${key}/${value}.js`;
    }
    copySync(source, `${targetPath}/${value}.js`);
    await openEditor(context, targetPath, value);
  }
};


/**
 * @function
 * @param {array} triggers Currently selected triggers in CLI flow array of key/values
 * @example ["{"TriggerName2":["template2"]}"]
 * @param {string} previous Serialized object of previously selected trigger values
 * @example "{\"TriggerName1\":[\"template1\"]}"
 * @return {object} Object with current and previous triggers, with concatenated values for unions
 */
const parseTriggerSelections = (triggers, previous) => {
  const triggerObj = {};
  const previousTriggers = previous && previous.length > 0 ? JSON.parse(previous) : null;
  const previousKeys = previousTriggers ? Object.keys(previousTriggers) : [];
  for (let i = 0; i < triggers.length; i += 1) {
    if (typeof triggers[i] === 'string') {
      triggers[i] = JSON.parse(triggers[i]);
    }
    const currentTrigger = Object.keys(triggers[i])[0];
    const currentValue = Object.values(triggers[i])[0];
    if (!triggerObj[currentTrigger]) {
      triggerObj[currentTrigger] = currentValue;
    } else {
      triggerObj[currentTrigger] = uniq(triggerObj[currentTrigger]
        .concat(currentValue));
    }
    if (previousTriggers && previousTriggers[currentTrigger]) {
      triggerObj[currentTrigger] = uniq(triggerObj[currentTrigger]
        .concat(previousTriggers[currentTrigger]));
    }
  }
  for (let x = 0; x < previousKeys.length; x += 1) {
    if (!triggerObj[previousKeys[x]]) {
      triggerObj[previousKeys[x]] = previousTriggers[previousKeys[x]];
    }
  }
  return triggerObj;
};


const getTriggerEnvVariables = (context, trigger, category) => {
  let env = [];
  const meta = context.amplify.getTriggerMetadata(
    `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/${trigger.key}`,
    trigger.key,
  );
  if (trigger.modules) {
    for (let x = 0; x < trigger.modules.length; x++) {
      if (meta[trigger.modules[x]] && meta[trigger.modules[x]].env) {
        env = env.concat(meta[trigger.modules[x]].env);
      }
    }
    return env;
  }

  return [];
};

module.exports = {
  triggerFlow,
  createTrigger,
  parseTriggerSelections,
  getTriggerMetadata,
  getTriggerPermissions,
  getTriggerEnvVariables,
};
