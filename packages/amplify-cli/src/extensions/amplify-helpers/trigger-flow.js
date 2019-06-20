const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');
const {
  readdirSync,
  statSync,
  readFileSync,
  unlinkSync,
} = require('fs');
const { copySync } = require('fs-extra');
const { flattenDeep } = require('lodash');
const { join } = require('path');
const { updateResource } = require('../../../../amplify-category-function/provider-utils/awscloudformation');

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
  if (!category) throw new Error('No category provided to trigger question flow');

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
const getTriggerPermissions = async (context, triggers, category, resourceName) => {
  let permissions = [];
  const parsedTriggers = JSON.parse(triggers);
  const triggerKeys = Object.keys(parsedTriggers);

  for (let c = 0; c < triggerKeys.length; c += 1) {
    const index = triggerKeys[c];
    const meta = context.amplify.getTriggerMetadata(
      `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/${index}`,
      index,
    );

    const moduleKeys = Object.keys(meta);
    for (let v = 0; v < moduleKeys.length; v += 1) {
      if (parsedTriggers[index].includes(moduleKeys[v]) && meta[moduleKeys[v]].permissions) {
        permissions = permissions.concat(meta[moduleKeys[v]].permissions);
      } else if (parsedTriggers[index].includes('custom')) {
        await updateResource(context, 'function', 'Lambda', null, `${resourceName}${triggerKeys[c]}`, true);
      }
    }
  }
  permissions = permissions.map(i => JSON.stringify(i));
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

const addTrigger = async (
  key,
  values,
  context,
  resourceName,
  triggerEnvs,
  category,
  parentStack,
  targetPath,
  parentResource,
) => {
  let add;
  try {
    ({ add } = require('amplify-category-function'));
  } catch (e) {
    throw new Error('Function plugin not installed in the CLI. You need to install it to use this feature.');
  }

  await add(context, 'awscloudformation', 'Lambda', {
    modules: values,
    parentResource,
    resourceName,
    functionName: resourceName,
    parentStack,
    triggerEnvs: JSON.stringify(triggerEnvs[key]),
    roleName: resourceName,
  });
  context.print.success('Succesfully added the Lambda function locally');
  for (let v = 0; v < values.length; v += 1) {
    await copyFunctions(key, values[v], category, context, targetPath);
  }

  const result = {};
  result[key] = resourceName;
  return result;
};

const updateTrigger = async (
  key,
  values,
  context,
  resourceName,
  triggerEnvs,
  category,
  parentStack,
  targetPath,
  parentResource,
) => {
  const updatedTrigger = {};
  let update;
  try {
    ({ update } = require('amplify-category-function'));
  } catch (e) {
    throw new Error('Function plugin not installed in the CLI. You need to install it to use this feature.');
  }
  try {
    await update(context, 'awscloudformation', 'Lambda', {
      modules: values,
      parentResource,
      resourceName,
      functionName: resourceName,
      parentStack,
      triggerEnvs: JSON.stringify(triggerEnvs[key]),
      roleName: resourceName,
    }, resourceName);
    context.print.success('Succesfully updated the Lambda function locally');
    for (let v = 0; v < values.length; v += 1) {
      await copyFunctions(key, values[v], category, context, targetPath);
      context.amplify.updateamplifyMetaAfterResourceAdd(
        'function',
        resourceName,
        {
          build: true,
          dependsOn: undefined,
          providerPlugin: 'awscloudformation',
          service: 'Lambda',
        },
      );
    }

    await cleanFunctions(key, values, category, context, targetPath);

    return updatedTrigger;
  } catch (e) {
    throw new Error('Unable to update lambda function');
  }
};

const deleteDeselectedTriggers = async (
  currentTriggers,
  previousTriggers,
  resourceName,
  targetDir,
  context,
) => {
  const currentKeys = Object.keys(currentTriggers);
  const previousKeys = Object.keys(previousTriggers);
  // const newKeyValues = Object.assign(currentTriggers);

  for (let p = 0; p < previousKeys.length; p += 1) {
    if (!currentKeys.includes(previousKeys[p])) {
      const functionName = `${resourceName}${previousKeys[p]}`;
      const targetPath = `${targetDir}/function/${functionName}`;
      await context.amplify.deleteTrigger(context, functionName, targetPath);
    }
  }
};

const deleteTrigger = async (context, name, dir) => {
  try {
    await context.amplify.forceRemoveResource(context, 'function', name, dir);
  } catch (e) {
    throw new Error('Function plugin not installed in the CLI. You need to install it to use this feature.');
  }
};

const deleteAllTriggers = async (triggers, resourceName, dir, context) => {
  const previousKeys = Object.keys(triggers);
  for (let y = 0; y < previousKeys.length; y += 1) {
    const functionName = `${resourceName}${previousKeys[y]}`;
    const targetPath = `${dir}/function/${functionName}`;
    await deleteTrigger(context, functionName, targetPath);
  }
};

const copyFunctions = async (key, value, category, context, targetPath) => {
  const dirContents = readdirSync(targetPath);
  if (!dirContents.includes(`${value}.js`)) {
    let source = '';
    if (value === 'custom') {
      source = `${__dirname}/../../../../amplify-category-function/provider-utils/awscloudformation/function-template-dir/trigger-custom.js`;
    } else {
      source = `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/${key}/${value}.js`;
    }
    copySync(source, `${targetPath}/${value}.js`);
    await openEditor(context, targetPath, value);
  }
};

const cleanFunctions = async (key, values, category, context, targetPath) => {
  const meta = context.amplify.getTriggerMetadata(
    `${__dirname}/../../../../${category}/provider-utils/awscloudformation/triggers/${key}`,
    key,
  );
  const dirContents = readdirSync(targetPath);
  for (let x = 0; x < dirContents.length; x += 1) {
    if (dirContents[x] !== 'custom.js') {
      // checking that a file is js module (with extension removed) and no longer a selected module
      if (meta[`${dirContents[x].substring(0, dirContents[x].length - 3)}`] &&
      !values.includes(`${dirContents[x].substring(0, dirContents[x].length - 3)}`)) {
        try {
          unlinkSync(`${targetPath}/${dirContents[x]}`);
        } catch (e) {
          throw new Error('Failed to delete module');
        }
      }
    }
    if (dirContents[x] === 'custom.js' && !values.includes('custom')) {
      try {
        unlinkSync(`${targetPath}/${dirContents[x]}`);
      } catch (e) {
        throw new Error('Failed to delete module');
      }
    }
  }
  return null;
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
        const newEnv = meta[trigger.modules[x]].env.filter(a => !a.question);
        env = env.concat(newEnv);
      }
    }
    return env;
  }

  return null;
};

const getTriggerEnvInputs = async (context, path, triggerKey, triggerValues, currentEnvVars) => {
  const metadata = getTriggerMetadata(path, triggerKey);
  const intersection = Object.keys(metadata).filter(value => triggerValues.includes(value));
  const answers = {};
  for (let i = 0; i < intersection.length; i += 1) {
    if (metadata[intersection[i]].env) {
      const questions = metadata[intersection[i]].env.filter(m => m.question);
      if (questions && questions.length) {
        for (let j = 0; j < questions.length; j += 1) {
          if (!currentEnvVars || !currentEnvVars[questions[j].key]) {
            const answer = await inquirer.prompt(questions[j].question);
            answers[questions[j].key] = answer[questions[j].key];
          }
        }
      }
    }
  }
  return Object.assign(answers, currentEnvVars);
};

const dependsOnBlock = (context, triggerKeys = [], provider) => {
  if (!context) throw new Error('No context provided to dependsOnBlock');
  if (!provider) throw new Error('No provider provided to dependsOnBlock');
  const dependsOnArray = context.updatingAuth && context.updatingAuth.dependsOn ?
    context.updatingAuth.dependsOn :
    [];
  triggerKeys.forEach((l) => {
    if (!dependsOnArray.find(a => a.resourceName === l)) {
      dependsOnArray.push({
        category: 'function',
        resourceName: l,
        triggerProvider: provider,
        attributes: ['Arn', 'Name'],
      });
    }
  });
  const tempArray = Object.assign([], dependsOnArray);
  tempArray.forEach((x) => {
    if (x.triggerProvider === provider && !triggerKeys.includes(x.resourceName)) {
      const index = dependsOnArray.findIndex(i => i.resourceName === x.resourceName);
      dependsOnArray.splice(index, 1);
    }
  });
  return dependsOnArray;
};

module.exports = {
  triggerFlow,
  addTrigger,
  updateTrigger,
  deleteTrigger,
  deleteAllTriggers,
  deleteDeselectedTriggers,
  dependsOnBlock,
  getTriggerMetadata,
  getTriggerPermissions,
  getTriggerEnvVariables,
  getTriggerEnvInputs,
};
