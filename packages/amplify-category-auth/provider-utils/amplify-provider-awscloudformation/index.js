const fs = require('fs');
const inquirer = require('inquirer');

let serviceMetadata;

function serviceQuestions(context, defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename) {
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
    },
  ];

  // copy over the files

  return context.amplify.copyBatch(context, copyJobs, options);
}


function addResource(context, category, service, configure) {
  let props = {};
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services${configure}.json`))[service];
  const { cfnFilename, defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename } = serviceMetadata;

  return serviceQuestions(context, defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename)
    .then((result) => {

      /* for each auth selection made by user,
       * populate defaults associated with the choice into props object */
      const defaultValuesSrc = `${__dirname}/assets/${defaultValuesFilename}`;
      const stringMapFileSrc = `${__dirname}/assets/${stringMapFilename}`
      const { functionMap } = require(defaultValuesSrc);
      const { authFlowMap, coreAttributeMap, appClientReadAttributeMap} = require(stringMapFileSrc); 

      result.authSelections.forEach((i) => {
        props = Object.assign(props, functionMap[i](result.resourceName));
      });

      /* merge actual answers object into props object of defaults answers,
       * ensuring that manual entries override defaults */
      props = Object.assign(props, result);

      if (props.userpoolClientAuthFlow){
        props.userpoolClientAuthFlow = props.userpoolClientAuthFlow.map((x) => {
          return authFlowMap[x]
        })
      }

      if (props.requiredAttributes){
        props.requiredAttributes = props.requiredAttributes.map((v) => {
          return coreAttributeMap[v]
        })
      }

      if (props.userpoolClientSetAttributes){
        props.userpoolClientReadAttributes = props.userpoolClientReadAttributes.map((v) => {
          return appClientReadAttributeMap[v] 
        })
        props.userpoolClientWriteAttributes = props.userpoolClientWriteAttributes.map((t) => {
          return coreAttributeMap[t]
        })
      }

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
