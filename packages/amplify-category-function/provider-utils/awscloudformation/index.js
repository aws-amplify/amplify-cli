const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const {
  invokeFunction,
} = require('./utils/invoke');

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
  const pluginDir = options.triggerDir || __dirname;
  let force = false;
  let params = Object.assign({}, options);
  let triggerEnvs = {};
  let writeParams;

  const copyJobs = [{
    dir: pluginDir,
    template: `cloudformation-templates/${cfnFilename}`,
    target: `${targetDir}/${category}/${options.resourceName}/${options.resourceName}-cloudformation-template.json`,
  }];

  if (options.trigger === true) {
    force = true;

    const triggerIndexPath = options.triggerIndexPath || 'function-template-dir/trigger-index.js';
    const triggerPackagePath = options.triggerPackagePath || 'function-template-dir/package.json.ejs';
    const triggerEventPath = options.triggerEventPath || 'function-template-dir/event.json';

    /*
      we treat the parameters from the team provider as private, so we need to update
      the triggerEnvs stringified array only in the options that will be written to the CF
      template parameters
    */

    if (params.trigger) {
      delete options.triggerIndexPath;
      delete options.triggerPackagePath;
      delete options.triggerDir;
      delete options.triggerEventPath;

      if (params.triggerEnvs) {
        triggerEnvs = context.amplify.loadEnvResourceParameters(context, 'function', params.resourceName);
        params.triggerEnvs = JSON.parse(params.triggerEnvs) || [];

        params.triggerEnvs.forEach((c) => {
          triggerEnvs[c.key] = c.value;
        });
      }
      writeParams = { modules: params.modules.join(), resourceName: params.resourceName };
      params = Object.assign(params, triggerEnvs);
    }

    copyJobs.push(...[
      {
        dir: pluginDir,
        template: triggerIndexPath,
        target: `${targetDir}/${category}/${options.resourceName}/src/index.js`,
        paramsFile: `${targetDir}/${category}/${options.resourceName}/parameters.json`,
      },
      {
        dir: pluginDir,
        template: triggerEventPath,
        target: `${targetDir}/${category}/${options.resourceName}/src/event.json`,
      },
      {
        dir: pluginDir,
        template: triggerPackagePath,
        target: `${targetDir}/${category}/${options.resourceName}/src/package.json`,
      },
    ]);
  } else {
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
  }
  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, params, force, writeParams);
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

async function addResource(context, category, service, options, parameters) {
  let answers;
  serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const cfnFilename = parameters && parameters.triggerTemplate ?
    parameters.triggerTemplate : serviceMetadata.cfnFilename;
  let result;

  if (!parameters) {
    result = await serviceQuestions(context, defaultValuesFilename, serviceWalkthroughFilename);
  } else {
    result = { answers: parameters };
  }

  if (result.answers) {
    ({ answers } = result);
    options.dependsOn = result.dependsOn;
  } else {
    answers = result;
  }

  if (!answers.resourceName) {
    answers.resourceName = answers.functionName;
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(
    category,
    answers.resourceName,
    options,
  );

  copyCfnTemplate(context, category, answers, cfnFilename);
  if (answers.parameters || answers.trigger) {
    const props = answers.parameters || parameters;
    createParametersFile(context, props, answers.resourceName);
  }

  if (!parameters || (parameters && !parameters.skipEdit)) {
    await openEditor(context, category, answers);
  }

  return answers.resourceName;
}

async function updateResource(context, category, service, parameters, resourceToUpdate) {
  let answers;
  serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { serviceWalkthroughFilename } = serviceMetadata;

  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);

  let result;

  if (!parameters) {
    result = await updateWalkthrough(context, resourceToUpdate);
  } else {
    result = { answers: parameters };
  }


  if (result.answers) {
    ({ answers } = result);
  } else {
    answers = result;
  }

  if (!answers.resourceName) {
    answers.resourceName = answers.functionName;
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

  if (answers.trigger) {
    const parametersFilePath =
      `${context.amplify.pathManager.getBackendDirPath()}/function/${resourceToUpdate}/parameters.json`;
    let previousParameters;

    if (fs.existsSync(parametersFilePath)) {
      previousParameters = context.amplify.readJsonFile(parametersFilePath);

      if (previousParameters.trigger === true) {
        answers = Object.assign(answers, previousParameters);
      }
    }
    createParametersFile(context, parameters, answers.resourceName);
  }

  /* const parametersFilePath =
  `${context.amplify.pathManager.getBackendDirPath()}/function/${resourceToUpdate}/parameters.json`;
  let previousParameters;

  if(fs.existsSync(parametersFilePath)) {
    previousParameters = context.amplify.readJsonFile(parametersFilePath);

    if (previousParameters.trigger === true) {
      answers = Object.assign(answers, previousParameters);
    }
  }

  if (answers.trigger) {
    const props = answers.parameters || parameters;
    createParametersFile(context, props, answers.resourceName);
  }
  copyCfnTemplate(context, category, answers, cfnFilename, parameters); */

  if (!parameters || (parameters && !parameters.skipEdit)) {
    await openEditor(context, category, answers);
  }

  return answers.resourceName;
}

async function openEditor(context, category, options) {
  let displayName = 'local';
  if (options.trigger === true) {
    displayName = options.resourceName;
  }
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  if (!options.trigger === 'true') {
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
  } else if (await context.amplify.confirmPrompt.run(`Do you want to edit the ${displayName} lambda function now?`)) {
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

  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const srcDir = path.normalize(path.join(backEndDir, category, resourceName, 'src'));
  const event = context.amplify.readJsonFile(path.resolve(`${srcDir}/${resourceAnswers[inputs[9].key]}`));

  const invokeOptions = {
    packageFolder: srcDir,
    fileName: `${srcDir}/${resourceAnswers[inputs[2].key]}`,
    handler: `${resourceAnswers[inputs[3].key]}`,
    event,
  };

  invokeFunction(invokeOptions);
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

function isInHeadlessMode(context) {
  return context.exeInfo.inputParams.yes;
}

function getHeadlessParams(context, service) {
  const { inputParams = {} } = context.exeInfo;
  return (
    inputParams.categories &&
    inputParams.categories.function &&
    Array.isArray(inputParams.categories.function)
  ) ? inputParams.categories.function.find(i => i.resourceName === service) || {}
    : {};
}


async function updateConfigOnEnvInit(context, category, service) {
  const srvcMetaData = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`).Lambda;
  const providerPlugin = context.amplify.getPluginInstance(context, srvcMetaData.provider);
  const functionParametersPath = `${context.amplify.pathManager.getBackendDirPath()}/function/${service}/function-parameters.json`;
  let resourceParams = {};
  const functionParametersExists = await fs.exists(functionParametersPath);
  if (functionParametersExists) {
    resourceParams = context.amplify.readJsonFile(functionParametersPath);
  }
  let envParams = {};

  // headless mode
  if (isInHeadlessMode(context)) {
    const functionParams = getHeadlessParams(context, service);
    return functionParams;
  }

  if (resourceParams.trigger === true) {
    envParams = await initTriggerEnvs(
      context,
      resourceParams,
      providerPlugin,
      envParams,
      srvcMetaData,
    );
  }
  return envParams;
}

async function initTriggerEnvs(context, resourceParams, providerPlugin, envParams, srvcMetaData) {
  if (resourceParams && resourceParams.parentStack && resourceParams.parentResource) {
    const parentResourceParams = providerPlugin
      .loadResourceParameters(context, resourceParams.parentStack, resourceParams.parentResource);
    const triggers = typeof parentResourceParams.triggers === 'string' ? JSON.parse(parentResourceParams.triggers) : parentResourceParams.triggers;
    const currentTrigger = resourceParams.resourceName.replace(parentResourceParams.resourceName, '');
    if (currentTrigger && currentTrigger !== resourceParams.resourceName) {
      const currentEnvVariables = context.amplify.loadEnvResourceParameters(context, 'function', resourceParams.resourceName);
      const triggerPath = `${__dirname}/../../../amplify-category-${resourceParams.parentStack}/provider-utils/${srvcMetaData.provider}/triggers/${currentTrigger}`;
      if (context.commandName !== 'checkout') {
        envParams = await context.amplify.getTriggerEnvInputs(
          context,
          triggerPath,
          currentTrigger,
          triggers[currentTrigger],
          currentEnvVariables,
        );
      } else {
        envParams = currentEnvVariables;
      }
    }
  }
  return envParams;
}


module.exports = {
  addResource,
  updateResource,
  invoke,
  migrateResource,
  getPermissionPolicies,
  updateConfigOnEnvInit,
};
