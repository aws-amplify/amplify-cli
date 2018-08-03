const fs = require('fs');

let serviceMetadata;


function serviceQuestions(
  context,
  defaultValuesFilename,
  stringMapFilename,
  serviceWalkthroughFilename,
) {
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = require(serviceWalkthroughSrc);

  return serviceWalkthrough(context, defaultValuesFilename, stringMapFilename, serviceMetadata);
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
      paramsFile: `${targetDir}/${category}/${options.resourceName}/parameters.json`,
    },
  ];

  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, options, null, options);
}


function addResource(context, category, service) {
  let props = {};
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const {
    cfnFilename, defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename,
  } = serviceMetadata;

  return serviceQuestions(
    context,
    defaultValuesFilename,
    stringMapFilename,
    serviceWalkthroughFilename,
  )

    .then((result) => {
      /* for each auth selection made by user,
       * populate defaults associated with the choice into props object */
      const defaultValuesSrc = `${__dirname}/assets/${defaultValuesFilename}`;
      const { functionMap, generalDefaults } = require(defaultValuesSrc);

      /* if user has used the default configuration,
       * we populate base choices like authSelections and resourceName for them */
      if (!result.authSelections) {
        result = Object.assign(generalDefaults(), result);
      }

      /* merge actual answers object into props object of defaults answers,
       * ensuring that manual entries override defaults */

      props = Object.assign(functionMap[result.authSelections](result.resourceName), result);

      copyCfnTemplate(context, category, props, cfnFilename);
    })
    .then(() => props.resourceName);
}

function updateResource(context, category, service) {
  let props = {};
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const {
    cfnFilename, defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename,
  } = serviceMetadata;

  return serviceQuestions(
    context,
    defaultValuesFilename,
    stringMapFilename,
    serviceWalkthroughFilename,
  )

    .then((result) => {
      /* if user has used the default configuration,
       * we populate base choices like authSelections and resourceName for them */
      if (!result.authSelections) {
        result = Object.assign(context.updatingAuth, result);
      }

      /* merge actual answers object into props object of previous answers,
       * ensuring that manual entries override previous */

      props = Object.assign(context.updatingAuth, result);

      copyCfnTemplate(context, category, props, cfnFilename);
    })
    .then(() => props.resourceName);
}

module.exports = { addResource, updateResource };
