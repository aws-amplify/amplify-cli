const inquirer = require('inquirer');
const _ = require('lodash');

function parseInputs(input, amplify, defaultValuesFilename, stringMapsFilename, currentAnswers, context) { // eslint-disable-line max-len
  const defaultValuesSrc = `${__dirname}/../assets/${defaultValuesFilename}`;
  const stringMapsSrc = `${__dirname}/../assets/${stringMapsFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const { getAllMaps } = require(stringMapsSrc);

  // Can have a cool question builder function here based on input json - will iterate on this
  // Can also have some validations here based on the input json
  // Uncool implementation here

  let question = {
    name: input.key,
    message: input.question,
    prefix: input.prefix,
    suffix: input.suffix,
    when: amplify.getWhen(input, currentAnswers, context.updatingAuth, amplify),
    validate: amplify.inputValidation(input),
    default: (answers) => { // eslint-disable-line no-unused-vars
      // if the user is editing and there is a previous value, this is always the default
      if (context.updatingAuth && context.updatingAuth[input.key] !== undefined) {
        return context.updatingAuth[input.key];
      }
      // if not editing or no previous value, get defaults (either w/ or w/out social provider flow)
      return getAllDefaults(amplify.getProjectDetails(amplify))[input.key];
    },
  };

  if (input.type && ['list', 'multiselect'].includes(input.type)) {
    if (context.updatingAuth && input.iterator) {
      if (context.updatingAuth[input.iterator]) {
        question = Object.assign({
          choices: context.updatingAuth[input.iterator].map(i => ({
            name: i,
            value: i,
          })),
        }, question);
      }
    } else if (input.iterator) {
      // TODO: make iterator key useful for non-update actions
      question = Object.assign({
        choices: [],
      }, question);
    }
    if (input.filter) {
      // TODO: make this generic
      const choices = input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options;
      const { requiredAttributes } = Object.assign(context.updatingAuth ? context.updatingAuth : {}, currentAnswers);
      const attrMap = getAllMaps().attributeProviderMap;
      requiredAttributes.forEach((attr) => {
        choices.forEach((choice) => {
          choice.missingAttributes = [];
          if (!attrMap[attr][`${choice.name.toLowerCase()}`].attr) {
            choice.missingAttributes = choice.missingAttributes.length < 1 ? [attr] : choice.missingAttributes.push(attr);
            const newList = choice.missingAttributes.join(', ');
            choice.disabled = `Your userpool is configured to require ${newList.substring(0, newList.length)}, which cannot be retrieved from ${choice.name}`;
          }
        });
      });
      question = Object.assign({ choices }, question);
    } else if (!input.requiredOptions || (question.when && !question.when())) {
      question = Object.assign({
        choices: input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options,
      }, question);
    } else {
      /*eslint-disable*/
      const sourceValues = Object.assign(context.updatingAuth ? context.updatingAuth: {},  currentAnswers);
      const sourceArray = _.uniq(_.flatten(input.requiredOptions.map((i => sourceValues[i] || []))));
      const requiredOptions = getAllMaps()[input.map]
        .filter(x => sourceArray
          .includes(x.value));
      const trueOptions = getAllMaps()[input.map]
        .filter(x => !sourceArray
          .includes(x.value));
      const msg = requiredOptions && requiredOptions.length > 0 ?
     `--- ${input.requiredOptionsMsg} ${requiredOptions.map(t => t.name).join(', ')}   ---` :
      '';
      question = Object.assign(question, {
        choices: [ new inquirer.Separator(msg), ...trueOptions],
        filter: ((input) => { // eslint-disable-line no-shadow
          input = input.concat(...requiredOptions.map(z => z.value));
          return input;
        }),
      });
      /* eslint-enable */
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

module.exports = { parseInputs };
