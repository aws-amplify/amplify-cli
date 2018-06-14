const fs = require('fs');
const inquirer = require('inquirer');
const validator = require('../../../awsmobile-cli/src/extensions/awsmobile-helpers/input-validation').inputValidation;
const { getProjectDetails } = require('../../../awsmobile-cli/src/extensions/awsmobile-helpers/get-project-details');
const { getAllDefaults } = require('../get-defaults');

let serviceMetadata;

function serviceWalkthrough() {
  const { inputs } = serviceMetadata;
  const questions = [];
  for (let i = 0; i < inputs.length; i += 1) {
    let question = {
      name: inputs[i].key,
      message: inputs[i].question,
      validate: validator(inputs[i]),
      default: () => {
        const defaultValue = getAllDefaults(getProjectDetails())[inputs[i].key];
        return defaultValue;
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
    } else {
      question = Object.assign({
        type: 'input',
      }, question);
    }
    questions.push(question);
  }

  return inquirer.prompt(questions);
}


function copyCfnTemplate(context, category, options, cfnFilename) {
  const { awsmobile } = context;
  const targetDir = awsmobile.pathManager.getBackendDirPath();
  const pluginDir = __dirname;

  const copyJobs = [
    {
      dir: pluginDir,
      template: `cloudformation-templates/${cfnFilename}`,
      target: `${targetDir}/${category}/${options.resourceName}/${options.resourceName}-cloudformation-template.yml`,
    },
  ];

  // copy over the files
  return context.awsmobile.copyBatch(context, copyJobs, options);
}

function addResource(context, category, service) {
  let answers;
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const { cfnFilename } = serviceMetadata;

  return serviceWalkthrough()
    .then((result) => {
      answers = result;
      copyCfnTemplate(context, category, answers, cfnFilename);
    })
    .then(() => answers.resourceName);
}

module.exports = { addResource };
