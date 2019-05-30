const { getAllMaps } = require('../assets/string-maps');
const { difference, pull } = require('lodash');

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
    parentStack,
  } = options;
  const targetDir = context.amplify.pathManager.getBackendDirPath();

  // if deleteAll is true, we delete all resources and immediately return
  if (deleteAll) {
    await context.amplify.deleteAllTriggers(previousTriggers, resourceName, targetDir, context);
    return {};
  }

  // handle missing parameters
  if (!triggerCapabilities || !resourceName || !parentStack) {
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
        const updatedLambda = await context.amplify.updateTrigger(
          keys[t],
          values[t],
          context,
          functionName,
          triggerEnvs,
          category,
          parentStack,
          targetPath,
        );
        triggerKeyValues = Object.assign(triggerKeyValues, updatedLambda);
      } else {
        const newLambda = await context.amplify.addTrigger(
          keys[t],
          values[t],
          context,
          functionName,
          triggerEnvs,
          category,
          parentStack,
          targetPath,
        );
        triggerKeyValues = Object.assign(triggerKeyValues, newLambda);
      }
    }
  }

  // loop through previous triggers to find those that are not in the current triggers, and delete
  for (let p = 0; p < previousKeys.length; p += 1) {
    if (!keys.includes(previousKeys[p])) {
      const functionName = `${resourceName}${previousKeys[p]}`;
      const targetPath = `${targetDir}/function/${functionName}`;
      await context.amplify.deleteTrigger(context, functionName, targetPath);
    }
  }
  return triggerKeyValues;
};


const sanitizePrevious = async (context, answers, previous) => {
  if (!context || !answers) {
    context.print.error('context or answers not provided to sanitizePrevious method.');
  }
  if (!previous || previous.length < 1) {
    return null;
  }
  const parsedPrevious = JSON.parse(previous) || {};
  const parsedKeys = Object.keys(parsedPrevious);
  const parsedValues = Object.values(parsedPrevious);

  const parsedAnswers = answers && answers.length > 0 ?
    reduceAnswerArray(answers) :
    {};

  const automaticOptions = getAllMaps().capabilities;

  parsedKeys.forEach((p, i) => {
    automaticOptions.forEach((a) => {
      const modulesSelected = parsedAnswers[a] ? parsedAnswers[a] : [];
      if (a.trigger === p && difference(a.modules, modulesSelected).length > 0) {
        const remainder = pull(parsedValues[i], ...a.modules);
        if (remainder && remainder.length > 0) {
          parsedPrevious[a.trigger] = remainder;
        } else {
          delete parsedPrevious[a];
        }
      }
    });
  });
  previous = JSON.stringify(parsedPrevious);
  return previous;
};


/*
  Creating Lambda Triggers
*/
async function handleTriggers(context, coreAnswers) {
  const previousTriggers = context.updatingAuth &&
    context.updatingAuth.triggerCapabilities &&
    context.updatingAuth.triggerCapabilities.length > 0 ?
    context.updatingAuth.triggerCapabilities :
    null;

  const resourceName = context.updatingAuth ?
    context.updatingAuth.resourceName :
    coreAnswers.resourceName;

  // if all triggers have been removed from auth, we delete all previously created triggers
  if (
    !previousTriggers === null &&
    (!coreAnswers.triggerCapabilities || coreAnswers.triggerCapabilities.length < 1)
  ) {
    coreAnswers.dependsOn = [];
    await createTrigger('amplify-category-auth', 'auth', resourceName, { deleteAll: true, resourceName }, context, JSON.parse(previousTriggers));
    return null;
  }

  const reducedTriggers = reduceAnswerArray(coreAnswers.triggerCapabilities);
  const triggerEnvs = {};
  Object.keys(reducedTriggers).forEach((r) => {
    triggerEnvs[r] = context.amplify.getTriggerEnvVariables(context, { key: r, modules: reducedTriggers[r] }, 'amplify-category-auth');
  });

  const parameters = {
    resourceName,
    triggerEnvs,
    parentStack: { Ref: 'AWS::StackId' },
    triggerCapabilities: reducedTriggers,
  };

  // create function resources and dependsOn block
  const lambdas = await createTrigger('amplify-category-auth', 'auth', coreAnswers.resourceName, parameters, context, JSON.parse(previousTriggers));
  coreAnswers = Object.assign(coreAnswers, lambdas);
  coreAnswers.dependsOn = [];
  Object.values(lambdas).forEach((l) => {
    coreAnswers.dependsOn.push({
      category: 'function',
      resourceName: l,
      attributes: ['Arn', 'Name'],
    });
  });


  return parameters.triggerCapabilities;
}

// since inquirer uses stringified key/value pairs as values for selected options,
// we change this array of stringified objects into a single object.
const reduceAnswerArray = (answers) => {
  const triggerObj = {};
  answers.forEach((t) => {
    const parsed = typeof t === 'string' ? JSON.parse(t) : t;
   /*eslint-disable-line*/ triggerObj[Object.keys(parsed)[0]] = Object.values(parsed)[0];
    return triggerObj;
  });
  return triggerObj;
};

module.exports = {
  sanitizePrevious,
  handleTriggers,
  reduceAnswerArray,
};
