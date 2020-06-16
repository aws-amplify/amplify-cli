const path = require('path');
const fs = require('fs-extra');

const serviceMetadataFor = service => require('../supported-services').default[service];
const datasourceMetadataFor = datasource => require('../supported-datasources').default[datasource];
const getServiceWalkthrough = walkthroughFilename => require(`./service-walkthroughs/${walkthroughFilename}`)['serviceWalkthrough'];

const parametersFileName = 'api-params.json';
const cfnParametersFilename = 'parameters.json';

const rootAssetDir = path.resolve(path.join(__dirname, '../../../resources/awscloudformation'));

function copyCfnTemplate(context, category, options, cfnFilename) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();

  const copyJobs = [
    {
      dir: path.join(rootAssetDir, 'cloudformation-templates'),
      template: cfnFilename,
      target: `${targetDir}/${category}/${options.resourceName}/${options.resourceName}-cloudformation-template.json`,
    },
  ];

  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, options, true, false);
}

function console(context, service) {
  const { serviceWalkthroughFilename } = serviceMetadataFor(service);
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { openConsole } = require(serviceWalkthroughSrc);

  if (!openConsole) {
    context.print.error('Opening console functionality not available for this option');
    process.exit(0);
  }

  return openConsole(context);
}

function addResource(context, category, service, options) {
  let answers;
  const serviceMetadata = serviceMetadataFor(service);
  let { cfnFilename } = serviceMetadata;
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  return getServiceWalkthrough(serviceWalkthroughFilename)(context, defaultValuesFilename, serviceMetadata).then(result => {
    if (result.answers) {
      ({ answers } = result);
      options.dependsOn = result.dependsOn;
    } else {
      answers = result;
    }
    if (result.output) {
      options.output = result.output;
    }
    if (!result.noCfnFile) {
      if (answers.customCfnFile) {
        cfnFilename = answers.customCfnFile;
      }
      copyCfnTemplate(context, category, answers, cfnFilename);

      const parameters = { ...answers };
      const cfnParameters = {
        authRoleName: {
          Ref: 'AuthRoleName',
        },
        unauthRoleName: {
          Ref: 'UnauthRoleName',
        },
      };
      const resourceDirPath = path.join(projectBackendDirPath, category, parameters.resourceName);
      fs.ensureDirSync(resourceDirPath);

      const parametersFilePath = path.join(resourceDirPath, parametersFileName);
      let jsonString = JSON.stringify(parameters, null, 4);
      fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

      const cfnParametersFilePath = path.join(resourceDirPath, cfnParametersFilename);
      jsonString = JSON.stringify(cfnParameters, null, 4);
      fs.writeFileSync(cfnParametersFilePath, jsonString, 'utf8');
    }
    context.amplify.updateamplifyMetaAfterResourceAdd(category, answers.resourceName, options);
    return answers.resourceName;
  });
}

async function updateResource(context, category, service) {
  let answers;
  const serviceMetadata = serviceMetadataFor(service);
  let { cfnFilename } = serviceMetadata;
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  if (!updateWalkthrough) {
    context.print.error('Update functionality not available for this option');
    process.exit(0);
  }

  return updateWalkthrough(context, defaultValuesFilename, serviceMetadata).then(result => {
    const options = {};
    if (result) {
      if (result.answers) {
        ({ answers } = result);
        options.dependsOn = result.dependsOn;
      } else {
        answers = result;
      }

      if (!result.noCfnFile) {
        if (answers.customCfnFile) {
          cfnFilename = answers.customCfnFile;
        }
        copyCfnTemplate(context, category, answers, cfnFilename);
        const parameters = { ...answers };
        const resourceDirPath = path.join(projectBackendDirPath, category, parameters.resourceName);
        fs.ensureDirSync(resourceDirPath);
        const parametersFilePath = path.join(resourceDirPath, parametersFileName);
        const jsonString = JSON.stringify(parameters, null, 4);
        fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
        context.amplify.updateamplifyMetaAfterResourceUpdate(category, answers.resourceName, 'dependsOn', answers.dependsOn);
      }
    }
  });
}

async function migrateResource(context, projectPath, service, resourceName) {
  const serviceMetadata = serviceMetadataFor(service);
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { migrate } = require(serviceWalkthroughSrc);

  if (!migrate) {
    context.print.info(`No migration required for ${resourceName}`);
    return;
  }

  return await migrate(context, projectPath, resourceName);
}

function addDatasource(context, category, datasource) {
  const serviceMetadata = datasourceMetadataFor(datasource);
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  return getServiceWalkthrough(serviceWalkthroughFilename)(context, defaultValuesFilename, serviceMetadata);
}

function getPermissionPolicies(context, service, resourceName, crudOptions) {
  const serviceMetadata = serviceMetadataFor(service);
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
  addResource,
  updateResource,
  console,
  migrateResource,
  addDatasource,
  getPermissionPolicies,
  rootAssetDir,
};
