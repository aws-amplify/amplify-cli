const fs = require('fs');
const path = require('path');

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
      target: `${targetDir}/${category}/${options.resourceName}/${options.resourceName}-cloudformation-template.yml`,
    },
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
  ];

  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, options);
}

function addResource(context, category, service, options) {
  let answers;
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const { cfnFilename, defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;

  return serviceQuestions(context, defaultValuesFilename, serviceWalkthroughFilename)
    .then((result) => {
      answers = result;
      copyCfnTemplate(context, category, answers, cfnFilename);
      context.amplify.updateamplifyMetaAfterResourceAdd(
        category,
        answers.resourceName,
        options,
      );
    })
    .then(() => answers.resourceName);
}

function invoke(context, category, resourceName) {
  // Run grunt
  const grunt = require('grunt');
  grunt.task.init = function () {};
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const srcDir = path.normalize(path.join(backEndDir, category, resourceName, 'src'));

  grunt.initConfig({
    lambda_invoke: {
      default: {
        options: {
          file_name: `${srcDir}/index.js`,
          event: `${srcDir}/event.json`,
        },
      },
    },
  });
  process.chdir(`${__dirname}/../../`); // grunt checks for node_mnodules in this dir

  grunt.loadNpmTasks('grunt-aws-lambda');

  grunt.tasks(['lambda_invoke'], {}, () => {
    console.log('Done running invoke function.');
  });
}

module.exports = { addResource, invoke };
