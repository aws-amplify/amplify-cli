const path = require('path');
const fs = require('fs-extra');

const parametersFileName = 'api-params.json';

let serviceMetadata;

function serviceQuestions(context, defaultValuesFilename, serviceWalkthroughFilename) {
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = require(serviceWalkthroughSrc);

  return serviceWalkthrough(context, defaultValuesFilename, serviceMetadata);
}


function copyCfnTemplate(context, category, options, cfnFilename) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;

  const copyJobs = [
    {
      dir: pluginDir,
      template: `cloudformation-templates/${cfnFilename}`,
      target: `${targetDir}/${category}/${options.resourceName}/${options.resourceName}-cloudformation-template.json`,
    },
  ];

  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, options, true, false);
}


function console(context, service) {
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const { serviceWalkthroughFilename } = serviceMetadata;
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
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  let { cfnFilename } = serviceMetadata;
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  return serviceQuestions(context, defaultValuesFilename, serviceWalkthroughFilename)
    .then((result) => {
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
        const resourceDirPath = path.join(projectBackendDirPath, category, parameters.resourceName);
        fs.ensureDirSync(resourceDirPath);
        const parametersFilePath = path.join(resourceDirPath, parametersFileName);
        const jsonString = JSON.stringify(parameters, null, 4);
        fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
      }
      context.amplify.updateamplifyMetaAfterResourceAdd(
        category,
        answers.resourceName,
        options,
      );
      return answers.resourceName;
    });
}


async function updateResource(context, category, service) {
  let answers;
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  let { cfnFilename } = serviceMetadata;
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  if (!updateWalkthrough) {
    context.print.error('Update functionality not available for this option');
    process.exit(0);
  }

  return updateWalkthrough(context, defaultValuesFilename, serviceMetadata)
    .then((result) => {
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
          const resourceDirPath = path.join(
            projectBackendDirPath,
            category,
            parameters.resourceName,
          );
          fs.ensureDirSync(resourceDirPath);
          const parametersFilePath = path.join(resourceDirPath, parametersFileName);
          const jsonString = JSON.stringify(parameters, null, 4);
          fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
          context.amplify.updateamplifyMetaAfterResourceUpdate(
            category,
            answers.resourceName,
            'dependsOn',
            answers.dependsOn,
          );
        }
      }
    });
}

module.exports = { addResource, updateResource, console };
