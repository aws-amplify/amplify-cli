const inquirer = require('inquirer');

async function serviceWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const { amplify } = context;
  const { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());
  let dependsOn = [];
  const parameters = {};
  // Ask resource and Lambda layer name

  const resourceQuestions = [
    {
      type: inputs[0].type,
      name: inputs[0].key,
      message: inputs[0].question,
      validate: amplify.inputValidation(inputs[0]),
      default: () => {
        const defaultValue = getAllDefaults(amplify.getProjectDetails())[inputs[0].key];
        return defaultValue;
      },
    },
    {
      type: inputs[1].type,
      name: inputs[1].key,
      message: inputs[1].question,
      validate: amplify.inputValidation(inputs[1]),
      default: answers => answers.resourceName,
    },
  ];

  const answers = await inquirer.prompt(resourceQuestions);

  Object.assign(allDefaultValues, answers);

  allDefaultValues.parameters = parameters;
  ({ dependsOn } = allDefaultValues);
  return { answers: allDefaultValues, dependsOn };
}

module.exports = {
  serviceWalkthrough,
};
