const fs = require('fs');
const inquirer = require('inquirer');

let serviceMetadata;

function serviceWalkthrough(context, defaultValuesFilename) {
  const { inputs } = serviceMetadata;
  const { awsmobile } = context;
  const defaultValuesSrc = `${__dirname}/default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

  const questions = [];
  for (let i = 0; i < inputs.length; i += 1) {
    // Can have a cool question builder function here based on input json - will iterate on this
    // Can also have some validations here based on the input json
    // Uncool implementation here

    let question = {
      name: inputs[i].key,
      message: inputs[i].question,
      when: awsmobile.getWhen(inputs[i]),
      validate: awsmobile.inputValidation(inputs[i]),
      default: (answers) => {
        const defaultValue = getAllDefaults(awsmobile.getProjectDetails())[inputs[i].key];

        if (defaultValue && answers.resourceName) {
          return defaultValue.replace(/<name>/g, answers.resourceName);
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

function addResource(context, category, service, configure) {
  let props = {};

  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services${configure}.json`))[service];
  const { cfnFilename, defaultValuesFilename } = serviceMetadata;

  return serviceWalkthrough(context, defaultValuesFilename)
    .then((result) => {
      /* for each auth selection made by user,
       * populate defaults associated with the choice into props object */
      const defaultValuesSrc = `${__dirname}/default-values/${defaultValuesFilename}`;
      const { functionMap } = require(defaultValuesSrc);

      result.authSelections.forEach((i) => {
        props = Object.assign(props, functionMap[i](result.resourceName));
      });

      /* merge actual answers object into props object of defaults answers,
       * ensuring that manual entries override defaults */
      props = Object.assign(props, result);

      /* make sure that resource name populates '<name'>
       * placeholder from default if it hasn't already */
      // TODO: improve this
      Object.keys(props).forEach((el) => {
        if (typeof props[el] === 'string') {
          props[el] = props[el].replace(/<name>/g, props.resourceName);
        }
      });

      copyCfnTemplate(context, category, props, cfnFilename);
    })
    .then(() => props.resourceName);
}

module.exports = { addResource };
