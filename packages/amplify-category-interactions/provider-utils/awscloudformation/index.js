const path = require('path');
const fs = require('fs-extra');
const uuid = require('uuid');

const authHelper = require('./auth-helper');

const parametersFileName = 'lex-params.json';

let serviceMetadata;

function copyCfnTemplate(context, category, options, cfnFilename) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;
  const defaultValuesSrc = `${__dirname}/default-values/lex-defaults.js`;
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
    },
  ];
  Object.assign(defaultValues, options);
  defaultValues.botArn = constructBotArn(defaultValues);
  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, defaultValues, true, false);
}

function constructBotArn(defaultValues) {
  const { authRoleArn, region, botName } = defaultValues;
  const accountNumber = authRoleArn.split(':')[4];
  return `arn:aws:lex:${region}:${accountNumber}:bot:${botName}:*`;
}

async function addResource(context, category, service, options) {
  await authHelper.ensureAuth(context);
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const { cfnFilename } = serviceMetadata;
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
  const { cfnFilename } = serviceMetadata;
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);

  return updateWalkthrough(context, defaultValuesFilename, serviceMetadata)
    .then((answers) => {
      answers.shortId = uuid().substring(0, 8);
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
