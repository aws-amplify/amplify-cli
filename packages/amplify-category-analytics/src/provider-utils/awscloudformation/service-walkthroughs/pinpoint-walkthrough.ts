/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { $TSContext, ResourceAlreadyExistsError, exitOnNextTick, AmplifyCategories, $TSAny, JSONUtilities } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { getNotificationsCategoryHasPinpointIfExists, getPinpointRegionMappings } from '../../../utils/pinpoint-helper';

// FIXME: may be removed from here, since addResource can pass category to addWalkthrough
const category = AmplifyCategories.ANALYTICS;
const parametersFileName = 'parameters.json';
const serviceName = 'Pinpoint';
const templateFileName = 'pinpoint-cloudformation-template.json';

/**
 * Add resource walkthrough for Pinpoint/Kinesis resource.
 * @param context amplify cli context
 * @param defaultValuesFilename default values for given walkthrough
 * @param serviceMetadata service related metadata from amplify-meta.json
 * @returns resource
 */
export const addWalkthrough = async (context: $TSContext, defaultValuesFilename: string, serviceMetadata: $TSAny): Promise<$TSAny> => {
  const resourceName = resourceAlreadyExists(context);

  if (resourceName) {
    const errMessage = 'Pinpoint analytics have already been added to your project.';
    printer.warn(errMessage);
    await context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));
    exitOnNextTick(0);
  } else {
    return configure(context, defaultValuesFilename, serviceMetadata, undefined);
  }
  return undefined;
};

const configure = (
  context: $TSContext,
  defaultValuesFilename: string,
  serviceMetadata: $TSAny,
  resourceName: string | undefined,
): $TSAny => {
  const { amplify } = context;
  let { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  if (resourceName) {
    inputs = inputs.filter((input: { key: string }) => input.key !== 'resourceName');
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    const parameters = context.amplify.readJsonFile(parametersFilePath);
    parameters.resourceName = resourceName;
    Object.assign(defaultValues, parameters);
  }

  const pinpointApp = getNotificationsCategoryHasPinpointIfExists();

  if (pinpointApp) {
    Object.assign(defaultValues, pinpointApp);
  }

  const questions = [];
  for (let i = 1; i < inputs.length; i += 1) {
    let question: $TSAny = {
      name: inputs[i].key,
      message: inputs[i].question,
      validate: amplify.inputValidation(inputs[i]),
      default: () => {
        const defaultValue = defaultValues[inputs[i].key];
        return defaultValue;
      },
    };

    if (inputs[i].type && inputs[i].type === 'list') {
      question = {
        type: 'list',
        choices: inputs[i].options,
        ...question,
      };
    } else if (inputs[i].type && inputs[i].type === 'multiselect') {
      question = {
        type: 'checkbox',
        choices: inputs[i].options,
        ...question,
      };
    } else {
      question = {
        type: 'input',
        ...question,
      };
    }
    questions.push(question);
  }

  return inquirer.prompt(questions).then(
    async (answers: $TSAny): Promise<$TSAny> => {
      answers[inputs[0].key] = answers[inputs[1].key];
      Object.assign(defaultValues, answers);
      const resource = defaultValues.resourceName;

      const analyticsRequirements = {
        authSelections: 'identityPoolOnly',
        allowUnauthenticatedIdentities: true,
      };

      const checkResult: $TSAny = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
        analyticsRequirements,
        context,
        'analytics',
        answers.resourceName,
      ]);

      // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
      // configuration.
      if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
        throw new Error(checkResult.errors.join(os.EOL));
      }

      if (checkResult.errors && checkResult.errors.length > 0) {
        printer.warn(checkResult.errors.join(os.EOL));
      }

      // If auth is not imported and there were errors, adjust or enable auth configuration
      if (!checkResult.authEnabled || !checkResult.requirementsMet) {
        printer.warn('Adding analytics would add the Auth category to the project if not already added.');
        if (
          await amplify.confirmPrompt(
            'Apps need authorization to send analytics events. Do you want to allow guests and unauthenticated users to send analytics events? (we recommend you allow this when getting started)',
          )
        ) {
          try {
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
              context,
              'analytics',
              answers.resourceName,
              analyticsRequirements,
            ]);
          } catch (error) {
            printer.error(error);
            throw error;
          }
        } else {
          try {
            printer.warn('Authorize only authenticated users to send analytics events. Use "amplify update auth" to modify this behavior.');
            analyticsRequirements.allowUnauthenticatedIdentities = false;
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
              context,
              'analytics',
              answers.resourceName,
              analyticsRequirements,
            ]);
          } catch (error) {
            printer.error(error);
            throw error;
          }
        }
      }

      // At this point we have a valid auth configuration either imported or added/updated.

      const resourceDirPath = path.join(projectBackendDirPath, category, resource);
      delete defaultValues.resourceName;
      writeParams(resourceDirPath, defaultValues);
      await writeCfnFile(context, resourceDirPath);
      return resource;
    },
  );
};

const resourceAlreadyExists = (context: $TSContext): string | undefined => {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let resourceName;

  if (amplifyMeta[category]) {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === serviceName) {
        resourceName = resource;
      }
    });
  }

  return resourceName;
};

const writeCfnFile = async (context: $TSContext, resourceDirPath: string, force = false): Promise<void> => {
  fs.ensureDirSync(resourceDirPath);
  const templateFilePath = path.join(resourceDirPath, templateFileName);
  if (!fs.existsSync(templateFilePath) || force) {
    const templateSourceFilePath = path.join(__dirname, '..', 'cloudformation-templates', templateFileName);
    const templateSource = context.amplify.readJsonFile(templateSourceFilePath);
    templateSource.Mappings = await getPinpointRegionMappings(context);
    JSONUtilities.writeJson(templateFilePath, templateSource);
  }
};

/**
 * Save the params.json file for analytics category
 * @param {*} resourceDirPath Path to params.json
 * @param {*} values values to be written to params.json
 */
export const writeParams = (resourceDirPath: string, values: Array<$TSAny>): void => {
  fs.ensureDirSync(resourceDirPath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const jsonString = JSON.stringify(values, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
};

/**
 * migrate from older version of pinpoint configuration to new version
 * @param {*} context amplify cli context
 */
export const migrate = (context: $TSContext): void => {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const { amplifyMeta } = context.migrationInfo;
  const { analytics = {} } = amplifyMeta;
  Object.keys(analytics).forEach(resourceName => {
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
};

const migrateCFN = (cfn: $TSAny): $TSAny => {
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
};

const migrateParams = (context: $TSContext, params: Record<string, $TSAny>): Record<string, $TSAny> => {
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
};

const replaceRef = (node: $TSAny, refName: string, refReplacement: $TSAny): $TSAny => {
  if (Array.isArray(node)) {
    return node.forEach(item => replaceRef(item, refName, refReplacement));
  }
  if (typeof node === 'object') {
    if (isRefNode(node, refName)) {
      delete node.Ref;
      Object.assign(node, refReplacement);
      return undefined;
    }
    Object.values(node).forEach(n => {
      replaceRef(n, refName, refReplacement);
    });
  }
  return undefined;
};

const isRefNode = (node: $TSAny, refName: string): boolean => {
  if (typeof node === 'object' && 'Ref' in node && node.Ref === refName) {
    return true;
  }
  return false;
};

/**
 * Given access pattern for Pinpoint resource, return the mobiletargeting IAM policies.
 * e.g 'create' access requires ['mobiletargeting:Put*', 'mobiletargeting:Create*', 'mobiletargeting:Send*']
 * @param resourceName Name of the Pinpoint resource
 * @param crudOptions create, read, update, delete access pattern for Auth/UnAuth roles
 * @returns IAM {policy, attributes}
 */
export const getIAMPolicies = (resourceName: string, crudOptions: $TSAny): $TSAny => {
  let policy = {};
  const actions: Array<string> = [];

  crudOptions.forEach((crudOption: string) => {
    switch (crudOption) {
      case 'create':
        actions.push('mobiletargeting:Put*', 'mobiletargeting:Create*', 'mobiletargeting:Send*');
        break;
      case 'update':
        actions.push('mobiletargeting:Update*');
        break;
      case 'read':
        actions.push('mobiletargeting:Get*', 'mobiletargeting:List*');
        break;
      case 'delete':
        actions.push('mobiletargeting:Delete*');
        break;
      default:
        console.log(`${crudOption} not supported`);
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
            '/*',
          ],
        ],
      },
    ],
  };

  const attributes = ['Id', 'Region'];

  return { policy, attributes };
};
