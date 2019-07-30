const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');

const providerName = 'awscloudformation';
const category = 'analytics';
const parametersFileName = 'parameters.json';
const serviceName = 'Pinpoint';
const templateFileName = 'pinpoint-cloudformation-template.json';

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const resourceName = resourceAlreadyExists(context);

  if (resourceName) {
    context.print.warning('Pinpoint analytics have already been added to your project.');
    process.exit(0);
  } else {
    return configure(context, defaultValuesFilename, serviceMetadata);
  }
}

function configure(context, defaultValuesFilename, serviceMetadata, resourceName) {
  const { amplify } = context;
  let { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  if (resourceName) {
    inputs = inputs.filter(input => input.key !== 'resourceName');
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    const parameters = context.amplify.readJsonFile(parametersFilePath);
    parameters.resourceName = resourceName;
    Object.assign(defaultValues, parameters);
  }

  const pinpointApp = checkIfNotificationsCategoryExists(context);

  if (pinpointApp) {
    Object.assign(defaultValues, pinpointApp);
  }

  const questions = [];
  for (let i = 1; i < inputs.length; i += 1) {
    let question = {
      name: inputs[i].key,
      message: inputs[i].question,
      validate: amplify.inputValidation(inputs[i]),
      default: () => {
        const defaultValue = defaultValues[inputs[i].key];
        return defaultValue;
      },
    };

    if (inputs[i].type && inputs[i].type === 'list') {
      question = Object.assign(
        {
          type: 'list',
          choices: inputs[i].options,
        },
        question,
      );
    } else if (inputs[i].type && inputs[i].type === 'multiselect') {
      question = Object.assign(
        {
          type: 'checkbox',
          choices: inputs[i].options,
        },
        question,
      );
    } else {
      question = Object.assign(
        {
          type: 'input',
        },
        question,
      );
    }
    questions.push(question);
  }

  return inquirer.prompt(questions).then(async (answers) => {
    answers[inputs[0].key] = answers[inputs[1].key];
    Object.assign(defaultValues, answers);
    const resource = defaultValues.resourceName;

    // Check for authorization rules and settings

    const { checkRequirements, externalAuthEnable } = require('amplify-category-auth');

    const apiRequirements = {
      authSelections: 'identityPoolOnly',
      allowUnauthenticatedIdentities: true,
    };
    // getting requirement satisfaction map
    const satisfiedRequirements = await checkRequirements(
      apiRequirements,
      context,
      'api',
      answers.resourceName,
    );
    // checking to see if any requirements are unsatisfied
    const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

    if (foundUnmetRequirements) {
      context.print.warning('Adding analytics would add the Auth category to the project if not already added.');
      if (
        await amplify.confirmPrompt.run('Apps need authorization to send analytics events. Do you want to allow guests and unauthenticated users to send analytics events? (we recommend you allow this when getting started)')
      ) {
        try {
          await externalAuthEnable(context, 'api', answers.resourceName, apiRequirements);
        } catch (e) {
          context.print.error(e);
          throw e;
        }
      } else {
        try {
          context.print.warning('Authorize only authenticated users to send analytics events. Use "amplify update auth" to modify this behavior.');
          apiRequirements.allowUnauthenticatedIdentities = false;
          await externalAuthEnable(context, 'api', answers.resourceName, apiRequirements);
        } catch (e) {
          context.print.error(e);
          throw e;
        }
      }
    }

    const resourceDirPath = path.join(projectBackendDirPath, category, resource);
    delete defaultValues.resourceName;
    writeParams(resourceDirPath, defaultValues);
    writeCfnFile(context, resourceDirPath);
    return resource;
  });
}

function checkIfNotificationsCategoryExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let pinpointApp;

  if (amplifyMeta.notifications) {
    const categoryResources = amplifyMeta.notifications;
    Object.keys(categoryResources).forEach((resource) => {
      if (categoryResources[resource].service === serviceName &&
        categoryResources[resource].output.Id) {
        pinpointApp = {};
        pinpointApp.appId = categoryResources[resource].output.Id;
        pinpointApp.appName = resource;
      }
    });
  }

  return pinpointApp;
}

function resourceAlreadyExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let resourceName;

  if (amplifyMeta[category]) {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach((resource) => {
      if (categoryResources[resource].service === serviceName) {
        resourceName = resource;
      }
    });
  }

  return resourceName;
}

function writeCfnFile(context, resourceDirPath, force = false) {
  fs.ensureDirSync(resourceDirPath);
  const templateFilePath = path.join(resourceDirPath, templateFileName);
  if (!fs.existsSync(templateFilePath) || force) {
    const templateSourceFilePath = `${__dirname}/../cloudformation-templates/${templateFileName}`;
    const templateSource = context.amplify.readJsonFile(templateSourceFilePath);
    templateSource.Mappings = getTemplateMappings(context);
    const jsonString = JSON.stringify(templateSource, null, 4);
    fs.writeFileSync(templateFilePath, jsonString, 'utf8');
  }
}

function getTemplateMappings(context) {
  const Mappings = {
    RegionMapping: {
    },
  };
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  const regionMapping = provider.getPinpointRegionMapping(context);
  Object.keys(regionMapping).forEach((region) => {
    Mappings.RegionMapping[region] = {
      pinpointRegion: regionMapping[region],
    };
  });
  return Mappings;
}

function writeParams(resourceDirPath, values) {
  fs.ensureDirSync(resourceDirPath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const jsonString = JSON.stringify(values, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
}

function migrate(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const { amplifyMeta } = context.migrationInfo;
  const { analytics = {} } = amplifyMeta;
  Object.keys(analytics).forEach((resourceName) => {
    const resourcePath = path.join(projectBackendDirPath, category, resourceName);
    const cfn = context.amplify.readJsonFile(path.join(resourcePath, 'pinpoint-cloudformation-template.json'));
    const updatedCfn = migrateCFN(cfn);

    fs.ensureDirSync(resourcePath);
    const templateFilePath = path.join(resourcePath, templateFileName);
    fs.writeFileSync(templateFilePath, JSON.stringify(updatedCfn, null, 4), 'utf8');

    const parameters = context.amplify.readJsonFile(path.join(resourcePath, 'parameters.json'));
    const updatedParams = migrateParams(context, parameters);
    const parametersFilePath = path.join(resourcePath, parametersFileName);
    fs.writeFileSync(parametersFilePath, JSON.stringify(updatedParams, null, 4), 'utf8');
  });
}

function migrateCFN(cfn) {
  const { Parameters, Conditions, Resources } = cfn;

  // update Parameters
  delete Parameters.IAMPrefix;
  Parameters.authRoleArn = {
    Type: 'String',
  };

  Parameters.env = {
    Type: 'String',
  };

  delete Parameters.IAMPrefix;

  // Update conditions
  Conditions.ShouldNotCreateEnvResources = {
    'Fn::Equals': [
      {
        Ref: 'env',
      },
      'NONE',
    ],
  };

  const oldRoleName = Resources.LambdaExecutionRole.Properties.RoleName;
  const newRoleName = {
    'Fn::If': [
      'ShouldNotCreateEnvResources',
      oldRoleName,
      {
        'Fn::Join': [
          '',
          [
            oldRoleName,
            '-',
            {
              Ref: 'env',
            },
          ],
        ],
      },
    ],
  };
  Resources.LambdaExecutionRole.Properties.RoleName = newRoleName;

  const oldAppName = Resources.PinpointFunctionOutputs.Properties.appName;
  const newAppName = {
    'Fn::If': [
      'ShouldNotCreateEnvResources',
      oldAppName,
      {
        'Fn::Join': [
          '',
          [
            oldAppName,
            '-',
            {
              Ref: 'env',
            },
          ],
        ],
      },
    ],
  };
  Resources.PinpointFunctionOutputs.Properties.appName = newAppName;
  // replace all IAMPrefix refs
  replaceRef(Resources, 'IAMPrefix', {
    'Fn::Select': ['4', { 'Fn::Split': [':', { Ref: 'authRoleArn' }] }],
  });

  return cfn;
}

function migrateParams(context, params) {
  const { defaultValuesFilename } = require(`${__dirname}/../../supported-services.json`)[serviceName];
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

  // no longer used
  delete params.IAMPrefix;

  // uses default value, which are refs to parent stack
  delete params.authRoleName;
  delete params.unauthRoleName;
  delete params.authRoleArn;

  const defaultValues = getAllDefaults(context.migrationInfo);
  delete defaultValues.resourceName;
  return { ...defaultValues, ...params };
}

function replaceRef(node, refName, refReplacement) {
  if (Array.isArray(node)) {
    return node.forEach(item => replaceRef(item, refName, refReplacement));
  }
  if (typeof node === 'object') {
    if (isRefNode(node, refName)) {
      delete node.Ref;
      Object.assign(node, refReplacement);
      return;
    }
    Object.values(node).forEach((n) => {
      replaceRef(n, refName, refReplacement);
    });
  }
}

function isRefNode(node, refName) {
  if (typeof node === 'object' && 'Ref' in node && node.Ref === refName) {
    return true;
  }
  return false;
}

function getIAMPolicies(resourceName, crudOptions) {
  let policy = {};
  const actions = [];

  crudOptions.forEach((crudOption) => {
    switch (crudOption) {
      case 'create': actions.push(
        'mobiletargeting:Put*',
        'mobiletargeting:Create*',
        'mobiletargeting:Send*',
      );
        break;
      case 'update': actions.push('mobiletargeting:Update*');
        break;
      case 'read': actions.push('mobiletargeting:Get*', 'mobiletargeting:List*');
        break;
      case 'delete': actions.push('mobiletargeting:Delete*');
        break;
      default: console.log(`${crudOption} not supported`);
    }
  });

  policy = {
    Effect: 'Allow',
    Action: actions,
    Resource: [
      {
        'Fn::Join': [
          '',
          [
            'arn:aws:mobiletargeting:',
            {
              Ref: `${category}${resourceName}Region`,
            },
            ':',
            { Ref: 'AWS::AccountId' },
            ':apps/',
            {
              Ref: `${category}${resourceName}Id`,
            },
          ],
        ],
      },
    ],
  };

  const attributes = ['Id', 'Region'];

  return { policy, attributes };
}


module.exports = { addWalkthrough, migrate, getIAMPolicies };
