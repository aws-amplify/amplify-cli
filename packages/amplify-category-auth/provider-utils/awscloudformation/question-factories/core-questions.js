const inquirer = require('inquirer');

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
      // if the user is editing and there is a previous value, this is alwasys the default
      if (context.updatingAuth && context.updatingAuth[input.key] !== undefined) {
        return context.updatingAuth[input.key];
      }

      // if not editing or no previous value, get defaults
      return getAllDefaults(amplify.getProjectDetails(amplify))[input.key];
    },
  };

  if (input.type && ['list', 'multiselect'].includes(input.type)) {
    if (!input.requiredOptions || !question.when()) {
      question = Object.assign({
        choices: input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options,
      }, question);
    } else {
      const sourceValues = currentAnswers[input.requiredOptions] ||
      context.updatingAuth[input.requiredOptions] ||
      [];
      const requiredOptions = getAllMaps()[input.map]
        .filter(x => sourceValues
          .includes(x.value));
      const trueOptions = getAllMaps()[input.map]
        .filter(x => !sourceValues
          .includes(x.value));
      /*eslint-disable*/
      question = Object.assign(question, {
        choices: [new inquirer.Separator(`--- ${input.requiredOptionsMsg} ${requiredOptions.map(t => t.name).join(', ')}   ---`), ...trueOptions],
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
