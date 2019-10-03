const inquirer = require('inquirer');
const { uniq, flatten } = require('lodash');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');

function parseInputs(input, amplify, defaultValuesFilename, stringMapsFilename, currentAnswers, context) { // eslint-disable-line max-len
  const defaultValuesSrc = `${__dirname}/../assets/${defaultValuesFilename}`;
  const stringMapsSrc = `${__dirname}/../assets/${stringMapsFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const { getAllMaps } = require(stringMapsSrc);

  // Can have a cool question builder function here based on input json - will iterate on this
  // Can also have some validations here based on the input json
  // Uncool implementation here

  const prefix = input.prefix ? `${'\n'} ${chalkpipe(null, input.prefixColor ? chalk[input.prefixColor] : chalk.green)(input.prefix)} ${'\n'}` : '';

  let question = {
    name: input.key,
    message: input.question,
    prefix,
    suffix: input.suffix,
    when: amplify.getWhen(input, currentAnswers, context.updatingAuth, amplify),
    validate: amplify.inputValidation(input),
    default: (answers) => { // eslint-disable-line no-unused-vars
      // if the user is editing and there is a previous value, this is always the default
      if (context.updatingAuth && context.updatingAuth[input.key] !== undefined) {
        if (input.key === 'triggers') {
          return triggerDefaults(context, input, getAllMaps(context.updatingAuth)[input.map]);
        }
        return context.updatingAuth[input.key];
      }
      // if not editing or no previous value, get defaults (either w/ or w/out social provider flow)
      return getAllDefaults(amplify.getProjectDetails(amplify))[input.key];
    },
  };

  if (input.type && ['list', 'multiselect'].includes(input.type)) {
    if (context.updatingAuth && input.iterator) {
      question = iteratorQuestion(input, question, context);
    } else if (input.filter) {
      question = filterInputs(input, question, getAllMaps, context, currentAnswers);
    } else if (input.requiredOptions) {
      question = getRequiredOptions(input, question, getAllMaps, context, currentAnswers);
    } else if (!input.requiredOptions || (question.when && !question.when())) {
      question = Object.assign({
        choices: input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options,
      }, question);
    }
  }

  if (input.type && input.type === 'list') {
    question = Object.assign({
      type: 'list',
    }, question);
  } else if (input.type && input.type === 'multiselect') {
    question = Object.assign({
      type: 'checkbox',
    }, question);
  } else if (input.type && input.type === 'confirm') {
    question = Object.assign({
      type: 'confirm',
    }, question);
  } else {
    question = Object.assign({
      type: 'input',
    }, question);
  }

  return question;
}

function iteratorQuestion(input, question, context) {
  if (context.updatingAuth[input.iterator]) {
    question = Object.assign({
      choices: context.updatingAuth[input.iterator].map(i => ({
        name: i,
        value: i,
      })),
    }, question);
  } else if (input.iterator) {
  // TODO: make iterator key useful for non-update actions
    question = Object.assign({
      choices: [],
    }, question);
  }
  return question;
}

function getRequiredOptions(input, question, getAllMaps, context, currentAnswers) {
  const sourceValues = Object
    .assign(context.updatingAuth ? context.updatingAuth : {}, currentAnswers);
  const sourceArray = uniq(flatten(input.requiredOptions.map((i => sourceValues[i] || []))));
  const requiredOptions =
    getAllMaps()[input.map] ? getAllMaps()[input.map]
      .filter(x => sourceArray
        .includes(x.value)) : [];
  const trueOptions =
    getAllMaps()[input.map] ? getAllMaps()[input.map]
      .filter(x => !sourceArray
        .includes(x.value)) : [];
  const msg = requiredOptions && requiredOptions.length > 0 ?
    `--- ${input.requiredOptionsMsg} ${requiredOptions.map(t => t.name).join(', ')}   ---` :
    '';
  question = Object.assign(question, {
    choices: [new inquirer.Separator(msg), ...trueOptions],
    filter: ((input) => { // eslint-disable-line no-shadow
      input = input.concat(...requiredOptions.map(z => z.value));
      return input;
    }),
  });
  return question;
}

function filterInputs(input, question, getAllMaps, context, currentAnswers) {
  if (input.filter === 'providers') {
    const choices = input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options;
    const { requiredAttributes } = Object.assign(context.updatingAuth ?
      context.updatingAuth :
      {}, currentAnswers);
    if (requiredAttributes) {
      const attrMap = getAllMaps().attributeProviderMap;
      requiredAttributes.forEach((attr) => {
        choices.forEach((choice) => {
          choice.missingAttributes = [];
          if (!attrMap[attr] || !attrMap[attr][`${choice.value.toLowerCase()}`].attr) {
            choice.missingAttributes = choice.missingAttributes.length < 1 ?
              [attr] :
              choice.missingAttributes.concat(attr);
            const newList = choice.missingAttributes.join(', ');
            choice.disabled = `Your userpool is configured to require ${newList.substring(0, newList.length)}, which cannot be retrieved from ${choice.name}`;
          }
        });
      });
    }
    question = Object.assign({ choices }, question);
  }
  if (input.filter === 'attributes') {
    let choices = input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options;
    choices = JSON.parse(JSON.stringify(choices));
    const attrMap = getAllMaps().attributeProviderMap;
    choices.forEach((choice) => {
      choice.missingProviders = [];
      if (attrMap[choice.value]) {
        Object.values(attrMap[choice.value]).forEach((provider, index) => {
          if (!provider.attr) {
            const providerKey = Object.keys(attrMap[choice.value])[index];
            let providerName = providerKey.charAt(0).toUpperCase() + providerKey.slice(1);
            if (providerName === 'Loginwithamazon') {
              providerName = 'Login With Amazon';
            }
            choice.missingProviders = choice.missingProviders.length < 1 ?
              [providerName] :
              choice.missingProviders.concat(providerName);
          }
        });
        if (choice.missingProviders && choice.missingProviders.length > 0) {
          const newList = choice.missingProviders.join(', ');
          choice.name = `${choice.name} (This attribute is not supported by ${newList.substring(0, newList.length)}.)`;
        }
      }
    });
    question = Object.assign({ choices }, question);
  }
  if (input.filter === 'updateOptions' && context.updatingAuth) {
    const choices = input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options;
    const newChoices = JSON.parse(JSON.stringify(choices));
    choices.forEach((c) => {
      if (c.conditionKey === 'useDefault' && context.updatingAuth[c.conditionKey] === c.value && !c.conditionMsg) {
        const index = newChoices.findIndex(i => i.name === c.name);
        newChoices.splice(index, 1);
      } else if (c.conditionMsg && !context.updatingAuth[c.conditionKey]) {
        if (context.updatingAuth.useDefault === 'defaultSocial') {
          const index = newChoices.findIndex(i => i.name === c.name);
          newChoices[index].disabled = `Disabled: ${c.conditionMsg}`;
        } else {
          const index = newChoices.findIndex(i => i.name === c.name);
          newChoices.splice(index, 1);
        }
      }
    });
    question = Object.assign({ choices: newChoices }, question);
  }
  return question;
}

function triggerDefaults(context, input, availableOptions) {
  const capabilityDefaults = [];
  if (context.updatingAuth.triggers) {
    const current = typeof context.updatingAuth[input.key] === 'string' ? JSON.parse(context.updatingAuth[input.key]) : context.updatingAuth[input.key];
    try {
      if (current) {
        availableOptions.forEach((a) => {
          let match = true;
          Object.keys(a.triggers).forEach((t) => {
            if (current[t]) {
              const test = a.triggers[t].every(c => current[t].includes(c));
              if (!test) {
                match = false;
              }
            } else {
              match = false;
            }
          });
          if (match) {
            capabilityDefaults.push(a.value);
          }
        });
      }
    } catch (e) {
      throw new Error('Error parsing capability defaults');
    }
  }
  return capabilityDefaults;
}

module.exports = { parseInputs };
