const fs = require('fs-extra');
const path = require('path');

const categoryName = 'layer';

let serviceMetadata;

async function serviceQuestions(context, defaultValuesFilename, serviceWalkthroughFilename) {
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = require(serviceWalkthroughSrc);

  return serviceWalkthrough(context, defaultValuesFilename, serviceMetadata);
}

function copyCfnTemplate(context, category, options, cfnFilename) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = options.triggerDir || __dirname;

  const copyJobs = [
    {
      dir: pluginDir,
      template: `cloudformation-templates/${cfnFilename}`,
      target: `${targetDir}/${category}/${options.resourceName}/${options.resourceName}-cloudformation-template.json`,
    },
    {
      dir: pluginDir,
      template: 'function-template-dir/package.json.ejs',
      target: `${targetDir}/${category}/${options.resourceName}/src/package.json`,
    },
  ];

  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, options, false);
}

function createParametersFile(context, parameters, resourceName) {
  const parametersFileName = 'function-parameters.json';
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, resourceName);
  fs.ensureDirSync(resourceDirPath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const jsonString = JSON.stringify(parameters, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
}

async function addResource(context, category, service, options, parameters) {
  let answers;
  serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const cfnFilename = parameters && parameters.triggerTemplate ? parameters.triggerTemplate : serviceMetadata.cfnFilename;
  let result;

  if (!parameters) {
    result = await serviceQuestions(context, defaultValuesFilename, serviceWalkthroughFilename);
  } else {
    result = { answers: parameters };
  }

  if (result.answers) {
    ({ answers } = result);
    options.dependsOn = result.dependsOn;
  } else {
    answers = result;
  }

  if (!answers.resourceName) {
    answers.resourceName = answers.layerName;
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(category, answers.resourceName, options);

  copyCfnTemplate(context, category, answers, cfnFilename);
  if (answers.parameters) {
    const props = answers.parameters || parameters;
    createParametersFile(context, props, answers.resourceName);
  }

  return answers.resourceName;
}

module.exports = {
  addResource,
};
