const path = require('path');
const fs = require('fs-extra');
const uuid = require('uuid');

const authHelper = require('./auth-helper');

const parametersFileName = 'lex-params.json';
const cfnParametersFilename = 'parameters.json';

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
  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, defaultValues, true, false);
}

async function addResource(context, category, service, options) {
  await authHelper.ensureAuth(context);
  serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { cfnFilename } = serviceMetadata;
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { addWalkthrough } = require(serviceWalkthroughSrc);

  const defaultValuesSrc = `${__dirname}/default-values/lex-defaults.js`;
  const { getAllDefaults } = require(defaultValuesSrc);
  const { amplify } = context;

  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  return addWalkthrough(context, defaultValuesFilename, serviceMetadata)
    .then((answers) => {
      copyCfnTemplate(context, category, answers, cfnFilename);

      const parameters = { ...answers };
      const cfnParameters = {
        authRoleArn: defaultValues.authRoleArn,
        authRoleName: defaultValues.authRoleName,
        unauthRoleName: defaultValues.unauthRoleName,
      };

      const resourceDirPath = path.join(projectBackendDirPath, category, parameters.resourceName);
      fs.ensureDirSync(resourceDirPath);

      const parametersFilePath = path.join(resourceDirPath, parametersFileName);
      let jsonString = JSON.stringify(parameters, null, 4);
      fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

      const cfnParametersFilePath = path.join(resourceDirPath, cfnParametersFilename);
      jsonString = JSON.stringify(cfnParameters, null, 4);
      fs.writeFileSync(cfnParametersFilePath, jsonString, 'utf8');

      context.amplify.updateamplifyMetaAfterResourceAdd(
        category,
        answers.resourceName,
        options,
      );
      return answers.resourceName;
    });
}

function updateResource(context, category, service) {
  serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
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

async function migrateResource(context, projectPath, service, resourceName) {
  serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { migrate } = require(serviceWalkthroughSrc);

  if (!migrate) {
    context.print.info(`No migration required for ${resourceName}`);
    return;
  }

  return await migrate(context, projectPath, resourceName);
}

function getPermissionPolicies(context, service, resourceName, crudOptions) {
  serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { getIAMPolicies } = require(serviceWalkthroughSrc);

  if (!getPermissionPolicies) {
    context.print.info(`No policies found for ${resourceName}`);
    return;
  }

  return getIAMPolicies(resourceName, crudOptions);
}


module.exports = {
  addResource, updateResource, migrateResource, getPermissionPolicies,
};
