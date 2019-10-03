

/**
 * @function
 * @param {object} context CLI context
 * @param {object} coreAnswers key/value pairs of auth flow answers
 * @param {object} previouslySaved key/value pairs of previously saved triggers
 * @return {object} Key/value pairs containing the trigger name and array of selected modules.
 */

/*
  Creating Lambda Triggers
*/
async function handleTriggers(context, coreAnswers, previouslySaved) {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  let triggerKeyValues = {};

  // get the resource name, either from user answer during creation or previous value
  const authResourceName = context.updatingAuth ?
    context.updatingAuth.resourceName :
    coreAnswers.resourceName;


  // double check to make sure triggers have not been serialized already
  const triggers = typeof coreAnswers.triggers === 'string' ?
    JSON.parse(coreAnswers.triggers) :
    coreAnswers.triggers;

  // getting static trigger env variables that do not change based on direct user input
  const triggerEnvs = {};
  Object.keys(triggers).forEach((r) => {
    triggerEnvs[r] = context.amplify.getTriggerEnvVariables(context, { key: r, modules: triggers[r] }, 'auth');
  });

  const parameters = {
    authResourceName,
    triggerEnvs,
    parentStack: { Ref: 'AWS::StackId' },
    triggers,
  };

  // creating array of trigger names
  const keys = Object.keys(triggers);

  // creating array of trigger values
  const values = Object.values(triggers);

  if (triggers) {
    for (let t = 0; t < keys.length; t += 1) {
      const functionName = `${authResourceName}${keys[t]}`;
      const targetPath = `${targetDir}/function/${functionName}/src`;
      if (previouslySaved && previouslySaved[keys[t]]) {
        const currentEnvVariables = context.amplify.loadEnvResourceParameters(context, 'function', functionName);
        await triggerEnvParams(context, keys[t], values[t], functionName, currentEnvVariables);
        const triggerOptions = {
          key: keys[t],
          values: values[t],
          context,
          functionName,
          triggerEnvs,
          category: 'auth',
          parentStack: 'auth',
          targetPath,
          triggerTemplate: `${keys[t]}.json.ejs`,
          triggerPackage: `${keys[t]}.package.json`,
          triggerEventPath: `${keys[t]}.event.json`,
          triggerDir: `${__dirname}/../triggers/${keys[t]}`,
          parentResource: authResourceName,
          skipEdit: true,
        };
        const updatedLambda = await context.amplify.updateTrigger(triggerOptions);
        triggerKeyValues = Object.assign(triggerKeyValues, updatedLambda);
      } else {
        await triggerEnvParams(context, keys[t], values[t], functionName);
        const triggerOptions = {
          key: keys[t],
          values: values[t],
          context,
          functionName,
          triggerEnvs,
          category: 'auth',
          parentStack: 'auth',
          targetPath,
          triggerTemplate: `${keys[t]}.json.ejs`,
          triggerDir: `${__dirname}/../triggers/${keys[t]}`,
          parentResource: authResourceName,
          skipEdit: true,
        };
        const newLambda = await context.amplify.addTrigger(triggerOptions);
        triggerKeyValues = Object.assign(triggerKeyValues, newLambda);
      }
    }
  }

  if (previouslySaved) {
    const previousTriggers = Object.keys(previouslySaved).map(i => `${authResourceName}${i}`);
    const currentTriggers = Object.keys(triggers).map(i => `${authResourceName}${i}`);
    await context.amplify.deleteDeselectedTriggers(
      currentTriggers,
      previousTriggers,
      authResourceName,
      targetDir,
      context,
    );
  }

  if (coreAnswers.triggers) {
    coreAnswers.parentStack = { Ref: 'AWS::StackId' };
  }


  return parameters.triggers;
}

// saving input-based trigger env variables to the team-provider
const triggerEnvParams = async (context, key, value, functionName, currentEnvVars) => {
  const triggerPath = `${__dirname}/../triggers/${key}`;
  const envs = await context
    .amplify.getTriggerEnvInputs(context, triggerPath, key, value, currentEnvVars);
  context.amplify.saveEnvResourceParameters(context, 'function', functionName, envs);
};

module.exports = {
  handleTriggers,
};
