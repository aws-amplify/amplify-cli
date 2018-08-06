const inquirer = require('inquirer');

function parseInputs(
  input, amplify,
  defaultValuesFilename,
  stringMapsFilename, currentAnswers, context,
) {
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
    when: amplify.getWhen(input, currentAnswers),
    validate: amplify.inputValidation(input),
    default: (answers) => { // eslint-disable-line no-unused-vars
      if (currentAnswers) {
        answers = Object.assign(answers, currentAnswers);
      }
      const defaultValue = getAllDefaults(amplify.getProjectDetails(amplify))[input.key];

      if (defaultValue) {
        return defaultValue;
      }

      if (context.api && context.api.privacy === 'protected' && input.key === 'allowUnauthenticatedIdentities') {
        return true;
      }

      return undefined;
    },
  };

  if (input.type && ['list', 'multiselect'].includes(input.type)) {
    if (!input.requiredOptions || !currentAnswers[input.requiredOptions]) {
      question = Object.assign({
        choices: input.map ? getAllMaps()[input.map] : input.options,
      }, question);
    } else {
      const requiredOptions = getAllMaps()[input.map]
        .filter(x => currentAnswers[input.requiredOptions]
          .includes(x.value));
      const trueOptions = getAllMaps()[input.map]
        .filter(x => !currentAnswers[input.requiredOptions]
          .includes(x.value));
      /*eslint-disable*/
      question = Object.assign(question, {
        choices: [new inquirer.Separator(`--- You have already selected the following attributes as required for this User Pool.  They are writeable by default: ${requiredOptions.map(t => t.name).join(', ')}   ---`), ...trueOptions],
        filter: ((input) => {
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
