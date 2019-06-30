const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

const categoryName = 'function';

let serviceMetadata;

async function serviceQuestions(context, defaultValuesFilename, serviceWalkthroughFilename) {
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = require(serviceWalkthroughSrc);

  return serviceWalkthrough(context, defaultValuesFilename, serviceMetadata);
}


function copyCfnTemplate(context, category, options, cfnFilename) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;

  const copyJobs = [{
    dir: pluginDir,
    template: `cloudformation-templates/${cfnFilename}`,
    target: `${targetDir}/${category}/${options.resourceName}/${options.resourceName}-cloudformation-template.json`,
  }];

  switch (options.functionTemplate) {
    case 'helloWorld':
      copyJobs.push(...[
        {
          dir: pluginDir,
          template: 'function-template-dir/index.js.ejs',
          target: `${targetDir}/${category}/${options.resourceName}/src/index.js`,
        },
        {
          dir: pluginDir,
          template: 'function-template-dir/event.json',
          target: `${targetDir}/${category}/${options.resourceName}/src/event.json`,
        },
        {
          dir: pluginDir,
          template: 'function-template-dir/package.json.ejs',
          target: `${targetDir}/${category}/${options.resourceName}/src/package.json`,
        },
      ]);
      break;
    case 'serverless':
      copyJobs.push(...[
        {
          dir: pluginDir,
          template: 'function-template-dir/serverless-index.js',
          target: `${targetDir}/${category}/${options.resourceName}/src/index.js`,
        },
        {
          dir: pluginDir,
          template: 'function-template-dir/serverless-app.js.ejs',
          target: `${targetDir}/${category}/${options.resourceName}/src/app.js`,
        },
        {
          dir: pluginDir,
          template: 'function-template-dir/serverless-package.json.ejs',
          target: `${targetDir}/${category}/${options.resourceName}/src/package.json`,
        },
        {
          dir: pluginDir,
          template: 'function-template-dir/serverless-event.json',
          target: `${targetDir}/${category}/${options.resourceName}/src/event.json`,
        },
      ]);
      break;
    default:
      copyJobs.push(...[
        {
          dir: pluginDir,
          template: 'function-template-dir/crud-index.js',
          target: `${targetDir}/${category}/${options.resourceName}/src/index.js`,
        },
        {
          dir: pluginDir,
          template: 'function-template-dir/crud-app.js.ejs',
          target: `${targetDir}/${category}/${options.resourceName}/src/app.js`,
        },
        {
          dir: pluginDir,
          template: 'function-template-dir/crud-package.json.ejs',
          target: `${targetDir}/${category}/${options.resourceName}/src/package.json`,
        },
        {
          dir: pluginDir,
          template: 'function-template-dir/crud-event.json',
          target: `${targetDir}/${category}/${options.resourceName}/src/event.json`,
        },
      ]);
      break;
  }

  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, options);
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

async function addResource(context, category, service, options) {
  let answers;
  serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { cfnFilename, defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;

  const result = await serviceQuestions(context, defaultValuesFilename, serviceWalkthroughFilename);

  if (result.answers) {
    ({ answers } = result);
    options.dependsOn = result.dependsOn;
  } else {
    answers = result;
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(
    category,
    answers.resourceName,
    options,
  );

  copyCfnTemplate(context, category, answers, cfnFilename);
  if (answers.parameters) {
    createParametersFile(context, answers.parameters, answers.resourceName);
  }

  await openEditor(context, category, answers);

  return answers.resourceName;
}

async function updateResource(context, category, service) {
  let answers;
  serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { serviceWalkthroughFilename } = serviceMetadata;

  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);

  const result = await updateWalkthrough(context);

  if (result.answers) {
    ({ answers } = result);
  } else {
    answers = result;
  }

  if (result.dependsOn) {
    context.amplify.updateamplifyMetaAfterResourceUpdate(
      category,
      answers.resourceName,
      'dependsOn',
      result.dependsOn,
    );
  }

  if (answers.parameters) {
    createParametersFile(context, answers.parameters, answers.resourceName);
  }


  await openEditor(context, category, answers);

  return answers.resourceName;
}

async function openEditor(context, category, options) {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  if (await context.amplify.confirmPrompt.run('Do you want to edit the local lambda function now?')) {
    const dirTemplate = `${targetDir}/${category}/${options.resourceName}/src`;
    const functionPackage = require(`${dirTemplate}/package.json`);
    await context.amplify.openEditor(context, `${dirTemplate}/${functionPackage.main}`);
  }
}

async function invoke(context, category, service, resourceName) {
  const { amplify } = context;
  serviceMetadata = amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { inputs } = serviceMetadata;
  const resourceQuestions = [
    {
      type: inputs[2].type,
      name: inputs[2].key,
      message: inputs[2].question,
      validate: amplify.inputValidation(inputs[2]),
      default: 'index.js',
    },
    {
      type: inputs[3].type,
      name: inputs[3].key,
      message: inputs[3].question,
      validate: amplify.inputValidation(inputs[3]),
      default: 'handler',
    },
    {
      type: inputs[9].type,
      name: inputs[9].key,
      message: inputs[9].question,
      validate: amplify.inputValidation(inputs[9]),
      default: 'event.json',
    },
  ];

  // Ask handler and function file name questions

  const resourceAnswers = await inquirer.prompt(resourceQuestions);


  // Run grunt for invoking lambda function

  const grunt = require('grunt');
  grunt.task.init = function () { }; //eslint-disable-line
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const srcDir = path.normalize(path.join(backEndDir, category, resourceName, 'src'));

  grunt.initConfig({
    lambda_invoke: {
      default: {
        options: {
          file_name: `${srcDir}/${resourceAnswers[inputs[2].key]}`,
          handler: `${resourceAnswers[inputs[3].key]}`,
          event: `${srcDir}/${resourceAnswers[inputs[9].key]}`,
        },
      },
    },
  });
  // For prod builds since dependencies are hoisted
  if (!fs.existsSync(`${__dirname}/../../node_modules/grunt-aws-lambda`)) {
    process.chdir(`${__dirname}/../../../../`); // grunt checks for node_mnodules in this dir
  } else {
    // For dev builds
    process.chdir(`${__dirname}/../../`); // grunt checks for node_mnodules in this dir
  }

  grunt.loadNpmTasks('grunt-aws-lambda');

  grunt.tasks(['lambda_invoke'], {}, () => {
    console.log('Done running invoke function.');
  });
}

function migrateResource(context, projectPath, service, resourceName) {
  serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { migrate } = require(serviceWalkthroughSrc);

  if (!migrate) {
    context.print.info(`No migration required for ${resourceName}`);
    return;
  }

  return migrate(context, projectPath, resourceName);
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
  addResource, updateResource, invoke, migrateResource, getPermissionPolicies,
};
