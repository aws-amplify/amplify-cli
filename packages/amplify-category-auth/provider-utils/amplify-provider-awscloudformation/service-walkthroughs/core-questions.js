const inquirer = require('inquirer');

async function serviceWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const { inputs } = serviceMetadata;
  const { amplify } = context;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

  const questions = [];
  for (let i = 0; i < inputs.length; i += 1) {
    // Can have a cool question builder function here based on input json - will iterate on this
    // Can also have some validations here based on the input json
    // Uncool implementation here

    let question = {
      name: inputs[i].key,
      message: inputs[i].question,
      when: amplify.getWhen(inputs[i]),
      validate: amplify.inputValidation(inputs[i]),
      default: (answers) => {
        const defaultValue = getAllDefaults(amplify.getProjectDetails())[inputs[i].key];

        if (defaultValue && typeof defaultValue === 'string' && answers.resourceName) {
          return defaultValue.replace(/<label>/g, answers.resourceName);
        } else if (defaultValue) {
          return defaultValue;
        }
        return undefined;
      },
    };

    if (inputs[i].type && inputs[i].type === 'list') {
      question = Object.assign({
        type: 'list',
        choices: inputs[i].options,
      }, question);
    } else if (inputs[i].type && inputs[i].type === 'multiselect') {
      question = Object.assign({
        type: 'checkbox',
        choices: inputs[i].options,
      }, question);
    } else if (inputs[i].type && inputs[i].type === 'confirm') {
      question = Object.assign({
        type: 'confirm'
      }, question)
    } else {
      question = Object.assign({
        type: 'input',
      }, question);
    }
    questions.push(question);
  }

  return inquirer.prompt(questions);
}

module.exports = { serviceWalkthrough };
