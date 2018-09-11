const path = require('path');
const fs = require('fs-extra');
const uuid = require('uuid');

const parametersFileName = 'lex-params.json';
const defaultValuesFilename = "lex-defaults.js";

let serviceMetadata;

function copyCfnTemplate(context, category, options, cfnFilename) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;
  const defaultValuesSrc = `${__dirname}/default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  const copyJobs = [
    {
      dir: pluginDir,
      template: `cloudformation-templates/${cfnFilename}`,
      target: `${targetDir}/${category}/${options.resourceName}/${options.resourceName}-cloudformation-template.json`,
    },
    {
      dir: pluginDir,
      template: 'function-template-dir/index.js.ejs',
      target: `${targetDir}/${category}/${options.resourceName}/src/index.js`,
    },
    {
      dir: pluginDir,
      template: 'function-template-dir/package.json.ejs',
      target: `${targetDir}/${category}/${options.resourceName}/src/package.json`,
    },
    {
      dir: pluginDir,
      template: 'function-template-dir/cfn-response.js',
      target: `${targetDir}/${category}/${options.resourceName}/src/cfn-response.js`,
    }
  ];

  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, Object.assign(defaultValues, options), true, false);
}

function addResource(context, category, service, options) {
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  let { cfnFilename } = serviceMetadata;
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { addWalkthrough } = require(serviceWalkthroughSrc);

  return addWalkthrough(context, defaultValuesFilename, serviceMetadata)
    .then((answers) => {
      copyCfnTemplate(context, category, answers, cfnFilename);

      const parameters = { ...answers };
      const resourceDirPath = path.join(projectBackendDirPath, category, parameters.resourceName);
      fs.ensureDirSync(resourceDirPath);
      const parametersFilePath = path.join(resourceDirPath, parametersFileName);
      const jsonString = JSON.stringify(parameters, null, 4);
      fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
      context.amplify.updateamplifyMetaAfterResourceAdd(
        category,
        answers.resourceName,
        options,
      );
      return answers.resourceName;
    });
}

function updateResource(context, category, service) {
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  let { cfnFilename } = serviceMetadata;
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);

  return updateWalkthrough(context, defaultValuesFilename, serviceMetadata)
    .then((answers) => {
      answers.shortId = uuid().substring(0,8);
      copyCfnTemplate(context, category, answers, cfnFilename);

      const parameters = { ...answers };
      const resourceDirPath = path.join(projectBackendDirPath, category, parameters.resourceName);
      fs.ensureDirSync(resourceDirPath);
      const parametersFilePath = path.join(resourceDirPath, parametersFileName);
      const jsonString = JSON.stringify(parameters, null, 4);
      fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
      context.amplify.updateamplifyMetaAfterResourceUpdate(
        category,
        answers.resourceName,
      );
      return answers.resourceName;
    });
}


module.exports = { addResource, updateResource };
