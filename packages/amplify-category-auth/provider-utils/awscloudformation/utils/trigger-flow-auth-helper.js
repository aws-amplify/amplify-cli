

/**
 * @function
 * @param {array} triggers Currently selected triggers in CLI flow array of key/values
 * @example ["{"TriggerName2":["template2"]}"]
 * @param {string} previous Serialized object of previously selected trigger values
 * @example "{\"TriggerName1\":[\"template1\"]}"
 * @return {object} Object with current and previous triggers, with concatenated values for unions
 */

/*
  Creating Lambda Triggers
*/
async function handleTriggers(context, coreAnswers, previouslySaved) {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  let triggerKeyValues = {};
  const resourceName = context.updatingAuth ?
    context.updatingAuth.resourceName :
    coreAnswers.resourceName;

  // const triggers = reduceAnswerArray(coreAnswers.authTriggers);

  const triggers = coreAnswers.authTriggers;

  const triggerEnvs = {};
  // Object.keys(triggers).forEach((r) => {
  Object.keys(triggers).forEach((r) => {
    triggerEnvs[r] = context.amplify.getTriggerEnvVariables(context, { key: r, modules: triggers[r] }, 'amplify-category-auth');
  });

  const parameters = {
    resourceName,
    triggerEnvs,
    parentStack: { Ref: 'AWS::StackId' },
    authTriggers: triggers,
  };

  // creating array of trigger names
  const keys = Object.keys(triggers);

  // creating array of trigger values
  const values = Object.values(triggers);

  if (triggers) {
    for (let t = 0; t < keys.length; t += 1) {
      const functionName = `${resourceName}${keys[t]}`;
      const targetPath = `${targetDir}/function/${functionName}/src`;
      if (previouslySaved && previouslySaved[keys[t]]) {
        const updatedLambda = await context.amplify.updateTrigger(
          keys[t],
          values[t],
          context,
          functionName,
          triggerEnvs,
          'amplify-category-auth',
          'auth',
          targetPath,
          previouslySaved,
        );
        triggerKeyValues = Object.assign(triggerKeyValues, updatedLambda);
      } else {
        const newLambda = await context.amplify.addTrigger(
          keys[t],
          values[t],
          context,
          functionName,
          triggerEnvs,
          'amplify-category-auth',
          'auth',
          targetPath,
        );
        triggerKeyValues = Object.assign(triggerKeyValues, newLambda);
      }
    }
  }

  if (previouslySaved) {
    await context.amplify.deleteDeselectedTriggers(
      triggers,
      previouslySaved,
      resourceName,
      targetDir,
      context,
    );
    const previousKeys = Object.keys(previouslySaved);

    for (let i = 0; i < previousKeys.length; i += 1) {
      if (!keys.includes(previousKeys[i])) {
        delete coreAnswers[previousKeys[i]];
      }
    }
  }

  coreAnswers = Object.assign(coreAnswers, triggerKeyValues);

  if (triggerKeyValues) {
    coreAnswers.parentStack = { Ref: 'AWS::StackId' };
  }

  return parameters.authTriggers;
}

// since inquirer uses stringified key/value pairs as values for selected options,
// we change this array of stringified objects into a single object.
const reduceAnswerArray = (answers) => {
  const triggerObj = {};
  if (!Array.isArray(answers)) {
    return JSON.parse(answers);
  } else if (answers && answers.length > 0) {
    answers.forEach((t) => {
      const parsed = typeof t === 'string' ? JSON.parse(t) : t;
      Object.keys(parsed).forEach((p, index) => {
        if (triggerObj[p]) {
          triggerObj[p] = triggerObj[p].concat(Object.values(parsed)[index]);
        } else {
          triggerObj[p] = Object.values(parsed)[index];
        }
      });
     /*eslint-disable-line*/ triggerObj[Object.keys(parsed)[0]] = Object.values(parsed)[0];
      return triggerObj;
    });
  }
  return triggerObj;
};

module.exports = {
  // sanitizePrevious,
  handleTriggers,
  reduceAnswerArray,
};
