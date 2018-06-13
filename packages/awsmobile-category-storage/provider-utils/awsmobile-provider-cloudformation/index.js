const fs = require('fs');
const inquirer = require('inquirer');

let serviceMetadata;

function serviceWalkthrough() {
  const { inputs } = serviceMetadata;
  const questions = [];
  for (let i = 0; i < inputs.length; i += 1) {
    // Can have a cool question builder function here based on input json - will iterate on this
    // Can also have some validations here based on the input json
    // Uncool implementation here
    if (inputs[i].options) {
      const question = {
        name: inputs[i].key,
        message: inputs[i].question,
        type: 'list',
        choices: inputs[i].options,
      };
      questions.push(question);
    } else {
      const question = {
        name: inputs[i].key,
        message: inputs[i].question,
        type: 'input',
      };
      questions.push(question);
    }
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
