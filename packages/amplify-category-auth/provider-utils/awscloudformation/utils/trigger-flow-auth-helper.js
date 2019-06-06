const { getAllMaps } = require('../assets/string-maps');
const { uniq, difference } = require('lodash');

/**
 * @function
 * @param {array} triggers Currently selected triggers in CLI flow array of key/values
 * @example ["{"TriggerName2":["template2"]}"]
 * @param {string} previous Serialized object of previously selected trigger values
 * @example "{\"TriggerName1\":[\"template1\"]}"
 * @return {object} Object with current and previous triggers, with concatenated values for unions
 */
/* eslint-disable no-loop-func */
const parseTriggerSelections = (triggers, previous, previousAuto) => {
  const triggerObj = {};
  const automaticOptions = getAllMaps().capabilities;
  const previousTriggers = previous && previous.length > 0 ? JSON.parse(previous) : {};
  const previousKeys = Object.keys(previousTriggers);

  for (let i = 0; i < triggers.length; i += 1) {
    if (typeof triggers[i] === 'string') {
      triggers[i] = JSON.parse(triggers[i]);
    }
    const currentTriggers = Object.keys(triggers[i]);
    const currentValues = Object.values(triggers[i]);
    currentTriggers.forEach((c, index) => {
      if (!triggerObj[c]) {
        triggerObj[c] = currentValues[index];
      } else {
        triggerObj[c] = uniq(triggerObj[c]
          .concat(currentValues[index]));
      }
      if (previousTriggers && previousTriggers[c]) {
        if (previousAuto && previousAuto.length > 0) {
          previousAuto.forEach((a) => {
            const automaticOption = automaticOptions.find(b => b.key === a);
            if (automaticOption) {
              Object.keys(automaticOption.triggers).forEach((e) => {
                if (previousTriggers[c]) {
                  const diff = difference(previousTriggers[e], automaticOption.triggers[e])
                    .filter(d => automaticOption.triggers[e].includes(d));
                  if (diff && diff.length > 0) {
                    triggerObj[c] = uniq(triggerObj[c]
                      .concat(previousTriggers[c]));
                  }
                }
              });
            }
          });
        } else {
          triggerObj[c] = uniq(triggerObj[c]
            .concat(previousTriggers[c]));
        }
      }
    });
  }

  if (previousAuto && previousAuto.length > 0) {
    previousAuto.forEach((a) => {
      const automaticOption = automaticOptions.find(b => b.key === a);
      if (automaticOption) {
        Object.keys(automaticOption.triggers).forEach((c) => {
          if (previousTriggers[c]) {
            const diff = difference(previousTriggers[c], automaticOption.triggers[c])
              .filter(d => automaticOption.triggers[c].includes(d));
            if (diff && diff.length > 0) {
              triggerObj[c] = diff;
            }
          }
        });
      }
    });
  }

  // looping through keys of previous triggers
  previousKeys.forEach((p) => {
    // if the trigger key is present in current trigger object
    if (triggerObj[p]) {
      // loop through modules in previous trigger
      previousTriggers[p].forEach((q) => {
        // check if module does not exist in current trigger object
        if (triggerObj[p].indexOf(q) === -1) {
          // check if module was an autotrigger that was removed - if not, push it
          if (previousAuto && previousAuto.length > 0) {
            const automaticOptionSet = automaticOptions.find(b => b.triggers[p] &&
              previousAuto.includes(b.key));
            if (!automaticOptionSet) {
              triggerObj[p] = triggerObj[p].push(previousTriggers[p]);
            }
          }
        }
      });
    } else {
      const tempArray = [];
      previousTriggers[p].forEach((i) => {
        if (previousAuto && previousAuto.length > 0) {
          const automaticOptionSet = automaticOptions.find(b => b.triggers[p] &&
            previousAuto.includes(b.key));
          if (!automaticOptionSet) {
            tempArray.push(i);
          } else if (!automaticOptionSet.triggers[p].includes(i)) {
            tempArray.push(i);
          }
        } else {
          tempArray.push(i);
        }
      });
      if (tempArray.length > 0) {
        triggerObj[p] = tempArray;
      }
    }
  });

  return triggerObj;
};
/* eslint-enable no-loop-func */

/*
  Creating Lambda Triggers
*/
async function handleTriggers(context, coreAnswers, previouslySaved) {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  let triggerKeyValues = {};
  const resourceName = context.updatingAuth ?
    context.updatingAuth.resourceName :
    coreAnswers.resourceName;

  const triggers = reduceAnswerArray(coreAnswers.triggerCapabilities);
  const triggerEnvs = {};
  Object.keys(triggers).forEach((r) => {
    triggerEnvs[r] = context.amplify.getTriggerEnvVariables(context, { key: r, modules: triggers[r] }, 'amplify-category-auth');
  });

  const parameters = {
    resourceName,
    triggerEnvs,
    parentStack: { Ref: 'AWS::StackId' },
    triggerCapabilities: triggers,
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

  return parameters.triggerCapabilities;
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
  parseTriggerSelections,
  handleTriggers,
  reduceAnswerArray,
};
