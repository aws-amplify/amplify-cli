const fs = require('fs');
const uuid = require('uuid');

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
      answers.unAuthRoleName = context.amplify.getProjectDetails().amplifyMeta.providers['amplify-provider-awscloudformation'].UnauthRoleName;
      answers.authRoleName = context.amplify.getProjectDetails().amplifyMeta.providers['amplify-provider-awscloudformation'].AuthRoleName,
      answers.policyName = answers.tableName + uuid()
      copyCfnTemplate(context, category, answers, cfnFilename);
      context.amplify.updateamplifyMetaAfterResourceAdd(
        category,
        answers.resourceName,
        options,
      );
      return answers.resourceName;
    });
}

module.exports = { addResource };
