const fs = require('fs');

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

function addResource(context, category, service) {
  let answers;
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const { cfnFilename, defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;

  return serviceQuestions(context, defaultValuesFilename, serviceWalkthroughFilename)
    .then((result) => {
      answers = result;
      copyCfnTemplate(context, category, answers, cfnFilename);
    })
    .then(() => answers.resourceName);
}

module.exports = { addResource };
