const fs = require('fs');
const inquirer = require('inquirer');

let serviceMetadata;

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

async function addResource(context, category, service, configure) {
  let props = {};

  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services${configure}.json`))[service];
  const { cfnFilename, defaultValuesFilename } = serviceMetadata;

  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/core-questions`;
  const { serviceWalkthrough } = require(serviceWalkthroughSrc);

  let result = await serviceWalkthrough(context, defaultValuesFilename, serviceMetadata)
    .then((result) => {
      /* for each auth selection made by user,
       * populate defaults associated with the choice into props object */
      const defaultValuesSrc = `${__dirname}/default-values/${defaultValuesFilename}`;
      const { functionMap } = require(defaultValuesSrc);

      result.authSelections.forEach((i) => {
        props = Object.assign(props, functionMap[i](result.resourceName));
      });

      /* merge actual answers object into props object of defaults answers,
       * ensuring that manual entries override defaults */
      props = Object.assign(props, result);

      /* make sure that resource name populates '<label'>
       * placeholder from default if it hasn't already */
      // TODO: improve this
      Object.keys(props).forEach((el) => {
        if (typeof props[el] === 'string') {
          props[el] = props[el].replace(/<label>/g, props.resourceName);
        }
      });

      copyCfnTemplate(context, category, props, cfnFilename);
    })
    .then(() => props.resourceName);
}

module.exports = { addResource };
