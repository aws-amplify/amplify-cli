const inquirer = require('inquirer');

function parseInputs(inputs, amplify, defaultValuesFilename, stringMapsFilename, currentAnswers) {
  const defaultValuesSrc = `${__dirname}/../assets/${defaultValuesFilename}`;
  const stringMapsSrc = `${__dirname}/../assets/${stringMapsFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const { getAllMaps } = require(stringMapsSrc);

  const questions = [];
  for (let i = 0; i < inputs.length; i += 1) {
    // Can have a cool question builder function here based on input json - will iterate on this
    // Can also have some validations here based on the input json
    // Uncool implementation here

    let question = {
      name: inputs[i].key,
      message: inputs[i].question,
      prefix: inputs[i].prefix,
      suffix: inputs[i].suffix,
      when: amplify.getWhen(inputs[i]),
      validate: amplify.inputValidation(inputs[i]),
      default: (answers) => { // eslint-disable-line no-unused-vars
        if (currentAnswers) {
          answers = Object.assign(answers, currentAnswers);
        }
        const defaultValue = getAllDefaults(amplify.getProjectDetails(amplify))[inputs[i].key];

        if (defaultValue) {
          return defaultValue;
        }
        return undefined;
      },
    };

    if (inputs[i].type && ['list', 'multiselect'].includes(inputs[i].type)) {
      if (!inputs[i].requiredOptions || !currentAnswers[inputs[i].requiredOptions]) {
        question = Object.assign({
          choices: inputs[i].map ? getAllMaps()[inputs[i].map] : inputs[i].options,
        }, question);
      } else {
        const requiredOptions = getAllMaps()[inputs[i].map]
          .filter(x => currentAnswers[inputs[i].requiredOptions]
            .includes(x.value));
        const trueOptions = getAllMaps()[inputs[i].map]
          .filter(x => !currentAnswers[inputs[i].requiredOptions]
            .includes(x.value));

        question = Object.assign(question, {
          choices: [new inquirer.Separator(`--- You have already selected the following attributes as required for this User Pool.  They are writeable by default: ${requiredOptions.map(t => t.name).join(', ')}   ---`), ...trueOptions],
          filter: ((input) => {
            input = input.concat(...requiredOptions.map(z => z.value));
            return input;
          }),
        });
      }
    }

    if (inputs[i].type && inputs[i].type === 'list') {
      question = Object.assign({
        type: 'list',
      }, question);
    } else if (inputs[i].type && inputs[i].type === 'multiselect') {
      question = Object.assign({
        type: 'checkbox',
      }, question);
    } else if (inputs[i].type && inputs[i].type === 'confirm') {
      question = Object.assign({
        type: 'confirm',
      }, question);
    } else {
      question = Object.assign({
        type: 'input',
      }, question);
    }
    questions.push(question);
  }

  return questions;
}

module.exports = { parseInputs };
