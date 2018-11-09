const fs = require('fs');
const { serviceWalkthrough } = require('./service-walkthroughs/auth-questions');

let serviceMetadata;

// Todo: move these to supported service.json

const ENV_SPECIFIC_PARAMS = [
  'facebookAppId',
  'googleClientId',
  'googleIos',
  'googleAndroid',
  'amazonAppId',
];

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
      target: `${targetDir}/${category}/${options.resourceName}/${
        options.resourceName
      }-cloudformation-template.yml`,
      paramsFile: `${targetDir}/${category}/${options.resourceName}/parameters.json`,
    },
  ];

  // copy over the files
  // Todo: move to provider as each provider should decide where to store vars, and cfn
  return context.amplify.copyBatch(context, copyJobs, options, true, false);
}

function saveResourceParameters(
  context,
  providerName,
  category,
  resource,
  params,
  envSpecificParams = [],
) {
  const provider = context.amplify.getPluginInstance(context, providerName);
  provider.saveResourceParameters(context, category, resource, params, envSpecificParams);
}

async function addResource(context, category, service) {
  let props = {};
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const {
    cfnFilename,
    defaultValuesFilename,
    stringMapFilename,
    serviceWalkthroughFilename,
    provider,
  } = serviceMetadata;
  const projectName = context.amplify.getProjectConfig().projectName.toLowerCase();

  return serviceQuestions(
    context,
    defaultValuesFilename,
    stringMapFilename,
    serviceWalkthroughFilename,
  )
    .then(async (result) => {
      const defaultValuesSrc = `${__dirname}/assets/${defaultValuesFilename}`;
      const { functionMap, generalDefaults, roles } = require(defaultValuesSrc);

      /* if user has used the default configuration,
       * we populate base choices like authSelections and resourceName for them */
      if (!result.authSelections) {
        result = Object.assign(result, generalDefaults(projectName));
      }

      /* merge actual answers object into props object,
       * ensuring that manual entries override defaults */

      props = Object.assign(functionMap[result.authSelections](result.resourceName), result, roles);

      await copyCfnTemplate(context, category, props, cfnFilename);
      saveResourceParameters(
        context,
        provider,
        category,
        result.resourceName,
        props,
        ENV_SPECIFIC_PARAMS,
      );
    })
    .then(() => props.resourceName);
}

function updateResource(context, category, serviceResult) {
  const { service, resourceName } = serviceResult;
  let props = {};
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const {
    cfnFilename,
    defaultValuesFilename,
    stringMapFilename,
    serviceWalkthroughFilename,
    provider,
  } = serviceMetadata;

  return serviceQuestions(
    context,
    defaultValuesFilename,
    stringMapFilename,
    serviceWalkthroughFilename,
  )
    .then(async (result) => {
      const defaultValuesSrc = `${__dirname}/assets/${defaultValuesFilename}`;
      const { functionMap, getAllDefaults } = require(defaultValuesSrc);
      const { authProviders } = require(`${__dirname}/assets/string-maps.js`);

      /* if user has used the default configuration,
       * we populate base choices like authSelections and resourceName for them */
      if (!result.authSelections) {
        result.authSelections = 'identityPoolAndUserPool';
      }

      const defaults = getAllDefaults(resourceName);

      const immutables = {};
      // loop through service questions
      serviceMetadata.inputs.forEach((s) => {
        // find those that would not be displayed if user was entering values manually
        if (!context.amplify.getWhen(s, defaults, context.updatingAuth, context.amplify)()) {
          // if a value wouldn't be displayed,
          // we update the immutable object with they key/value from previous answers
          if (context.updatingAuth[s.key]) {
            immutables[s.key] = context.updatingAuth[s.key];
          }
        }
      });

      if (result.useDefault && result.useDefault === 'default') {
        /* if the user elects to use defaults during an edit,
         * we grab all of the static defaults
         * but make sure to pass existing resource name so we don't create a 2nd auth resource
         * and we don't overwrite immutables from the originally entered values */

        props = Object.assign(defaults, immutables, result);
      } else {
        /* if the user does NOT choose defaults during an edit,
         * we merge actual answers object into props object of previous answers,
         * and in turn merge these into the defaults
         * ensuring that manual entries override previous which then
         * override defaults (except immutables) */
        props = Object.assign(
          functionMap[result.authSelections](context.updatingAuth.resourceName),
          context.updatingAuth,
          immutables,
          result,
        ); // eslint-disable-line max-len
      }

      if (!result.thirdPartyAuth) {
        delete props.selectedParties;
        delete props.authProviders;
        authProviders.forEach((a) => {
          if (props[a.answerHashKey]) {
            delete props[a.answerHashKey];
          }
        });
        if (props.googleIos) {
          delete props.googleIos;
        }
        if (props.googleAndroid) {
          delete props.googleAndroid;
        }
        if (props.audiences) {
          delete props.audiences;
        }
      }

      await copyCfnTemplate(context, category, props, cfnFilename);
      saveResourceParameters(context, provider, category, resourceName, props, ENV_SPECIFIC_PARAMS);
    })
    .then(() => props.resourceName);
}

async function updateConfigOnEnvInit(context, category, service) {
  const srvcMetaData = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))
    .Cognito;
  const { defaultValuesFilename, stringMapFilename } = srvcMetaData;

  const providerPlugin = context.amplify.getPluginInstance(context, srvcMetaData.provider);
  // previously selected answers
  const previousValues = providerPlugin.loadResourceParameters(context, 'auth', service);
  // ask only env specific questions
  const currentEnvSpecificValues = context.amplify.loadEnvResourceParameters(category, service);
  srvcMetaData.inputs = srvcMetaData.inputs.filter(input =>
    ENV_SPECIFIC_PARAMS.includes(input.key) &&
      !Object.keys(currentEnvSpecificValues).includes(input.key));

  const result = await serviceWalkthrough(
    context,
    defaultValuesFilename,
    stringMapFilename,
    srvcMetaData,
    previousValues,
  );
  const envParams = {};
  ENV_SPECIFIC_PARAMS.forEach((paramName) => {
    if (paramName in result) {
      envParams[paramName] = result[paramName];
    }
  });
  return envParams;
}

module.exports = { addResource, updateResource, updateConfigOnEnvInit };
