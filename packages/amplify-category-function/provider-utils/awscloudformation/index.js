const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

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
          template: 'function-template-dir/index.js',
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

async function addResource(context, category, service, options) {
  let answers;
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const { cfnFilename, defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;

  const result = await serviceQuestions(context, defaultValuesFilename, serviceWalkthroughFilename);

  if (result.answers) {
    ({ answers } = result);
    options.dependsOn = result.dependsOn;
  } else {
    answers = result;
  }

  copyCfnTemplate(context, category, answers, cfnFilename);
  context.amplify.updateamplifyMetaAfterResourceAdd(
    category,
    answers.resourceName,
    options,
  );

  await openEditor(context, category, answers);

  return answers.resourceName;
}

async function openEditor(context, category, options) {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  if (await context.amplify.confirmPrompt.run('Do you want to edit the local lambda function now?')) {
    switch (options.functionTemplate) {
      case 'helloWorld':
        await context.amplify.openEditor(context, `${targetDir}/${category}/${options.resourceName}/src/index.js`);
        break;
      case 'serverless':
        await context.amplify.openEditor(context, `${targetDir}/${category}/${options.resourceName}/src/app.js`);
        break;
      default:
        await context.amplify.openEditor(context, `${targetDir}/${category}/${options.resourceName}/src/app.js`);
        break;
    }
  }
}

async function invoke(context, category, service, resourceName) {
  const { amplify } = context;
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
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
          event: `${srcDir}/event.json`,
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

module.exports = { addResource, invoke };
