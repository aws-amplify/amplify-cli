const { getAllMaps } = require('../assets/string-maps');
const { difference, pull } = require('lodash');

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
  // const selectedKeys = Object.keys(selectedCapabilities);

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
    '{}';

  const resourceName = context.updatingAuth ?
    context.updatingAuth.resourceName :
    coreAnswers.resourceName;

  if (!coreAnswers.triggerCapabilities || coreAnswers.triggerCapabilities.length < 1) {
    coreAnswers.dependsOn = [];
    await context.amplify.createTrigger('amplify-category-auth', 'auth', resourceName, { deleteAll: true, resourceName }, context, JSON.parse(previousTriggers));
    return null;
  }

  const parameters = {
    resourceName,
    triggerCapabilities: reduceAnswerArray(coreAnswers.triggerCapabilities),
  };

  const lambdas = await context.amplify.createTrigger('amplify-category-auth', 'auth', coreAnswers.resourceName, parameters, context, JSON.parse(previousTriggers));
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

const reduceAnswerArray = (answers) => {
  const triggerObj = {};
  answers.forEach((t) => {
    const parsed = JSON.parse(t);
   /*eslint-disable-line*/ triggerObj[Object.keys(parsed)[0]] = Object.values(parsed)[0];
    return triggerObj;
  });
  return triggerObj;
};

module.exports = { sanitizePrevious, handleTriggers, reduceAnswerArray };
