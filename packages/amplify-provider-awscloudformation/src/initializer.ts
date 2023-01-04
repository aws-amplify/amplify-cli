/* eslint-disable import/no-cycle */
/* eslint-disable func-style */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  $TSContext,
  $TSObject,
  AmplifyError,
  AmplifyFault,
  JSONUtilities,
  PathConstants,
  pathManager,
  stateManager,
  Tag,
  Template,
} from 'amplify-cli-core';
import { AmplifySpinner } from 'amplify-prompts';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import * as vm from 'vm2';

import fs from 'fs-extra';
import glob from 'glob';
import moment from 'moment';
import path from 'path';
import sequential from 'promise-sequential';
import { getDefaultTemplateDescription } from './template-description-utils';
import { rootStackFileName } from './push-resources';
import { transformRootStack } from './override-manager';
import amplifyServiceManager from './amplify-service-manager';
import * as amplifyServiceMigrate from './amplify-service-migrate';
import Cloudformation from './aws-utils/aws-cfn';
import { S3 } from './aws-utils/aws-s3';
import * as configurationManager from './configuration-manager';
import constants from './constants';
import { configurePermissionsBoundaryForInit } from './permissions-boundary/permissions-boundary';
import { prePushCfnTemplateModifier } from './pre-push-cfn-processor/pre-push-cfn-modifier';
import archiver from './utils/archiver';
import { fileLogger } from './utils/aws-logger';

const logger = fileLogger('initializer');

type ParamType = {
  StackName: string,
  Capabilities: string[],
  TemplateBody: string,
  Parameters: {ParameterKey: string, ParameterValue: string}[],
  Tags: Tag[],
};

/**
 * initializer entry point
 */
export const run = async (context: $TSContext): Promise<void> => {
  await configurationManager.init(context);
  if (!context.exeInfo || context.exeInfo.isNewEnv) {
    context.exeInfo = context.exeInfo || {};
    const { projectName } = context.exeInfo.projectConfig;
    const initTemplateFilePath = path.join(__dirname, '..', 'resources', 'rootStackTemplate.json');
    /* eslint-disable-next-line spellcheck/spell-checker */
    const timeStamp = process.env.CIRCLECI ? uuid().substring(0, 5) : `${moment().format('Hmmss')}`;
    const { envName = '' } = context.exeInfo.localEnvInfo;
    let stackName = normalizeStackName(`amplify-${projectName}-${envName}-${timeStamp}`);
    const awsConfigInfo = await configurationManager.getAwsConfig(context);

    await configurePermissionsBoundaryForInit(context);

    const amplifyServiceParams = {
      context,
      awsConfigInfo,
      projectName,
      envName,
      stackName,
    };
    const { amplifyAppId, verifiedStackName, deploymentBucketName } = await amplifyServiceManager.init(amplifyServiceParams);

    // start root stack builder and deploy

    // moved cfn build to next its builder
    stackName = verifiedStackName;
    const Tags = context.amplify.getTags(context);

    const authRoleName = `${stackName}-authRole`;
    const unauthRoleName = `${stackName}-unauthRole`;

    const configuration = {
      authRole: {
        roleName: authRoleName,
      },
      unauthRole: {
        roleName: unauthRoleName,
      },
    };

    let projectInitialized = false;
    let overrideFilePath = '';
    try {
      const backendDir = pathManager.getBackendDirPath();
      overrideFilePath = path.join(backendDir, 'awscloudformation', 'build', 'override.js');
      projectInitialized = true;
    } catch (e) {
      // project not initialized
    }
    if (projectInitialized && fs.existsSync(overrideFilePath)) {
      try {
        const overrideCode: string = await fs.readFile(overrideFilePath, 'utf-8');
        if (overrideCode) {
          const sandboxNode = new vm.NodeVM({
            console: 'inherit',
            timeout: 5000,
            sandbox: {},
            require: {
              context: 'sandbox',
              builtin: ['path'],
              external: true,
            },
          });
          await sandboxNode.run(overrideCode).override(configuration);
        }
      } catch (err) {
        // absolutely want to throw if there is a compile or runtime error
        throw new AmplifyError('InvalidOverrideError', {
          message: `Executing overrides failed.`,
          details: err.message,
          resolution: 'There may be runtime errors in your overrides file. If so, fix the errors and try again.',
        }, err);
      }
    }

    const rootStack = JSONUtilities.readJson<Template>(initTemplateFilePath);

    await prePushCfnTemplateModifier(rootStack);

    rootStack.Description = getDefaultTemplateDescription(context, 'root');

    // deploy steps
    const params: ParamType = {
      StackName: stackName,
      Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
      TemplateBody: JSONUtilities.stringify(rootStack, { minify: context.input.options?.minify }),
      Parameters: [
        {
          ParameterKey: 'DeploymentBucketName',
          ParameterValue: deploymentBucketName,
        },
        {
          ParameterKey: 'AuthRoleName',
          ParameterValue: configuration.authRole.roleName,
        },
        {
          ParameterKey: 'UnauthRoleName',
          ParameterValue: configuration.unauthRole.roleName,
        },
      ],
      Tags,
    };

    const eventMap = createInitEventMap(params, envName, projectName);
    const cfnItem = await new Cloudformation(context, 'init', awsConfigInfo, eventMap);
    const stackDescriptionData = await cfnItem.createResourceStack(params);

    processStackCreationData(context, amplifyAppId, stackDescriptionData);
    cloneCLIJSONForNewEnvironment(context);
  } else if (
    // This part of the code is invoked by the `amplify init --appId xxx` command
    // on projects that are already fully setup by `amplify init` with the Amplify CLI version prior to 4.0.0.
    // It expects all the artifacts in the `amplify/.config` directory, the amplify-meta.json file in both
    // the `#current-cloud-backend` and the `backend` directories, and the team-provider-info file to exist.
    // It allows the local project's env to be added to an existing Amplify Console project, as specified
    // by the appId, without unnecessarily creating another Amplify Console project by the post push migration.
    !context.exeInfo.isNewProject
    && context.exeInfo.inputParams
    && context.exeInfo.inputParams.amplify
    && context.exeInfo.inputParams.amplify.appId
  ) {
    await amplifyServiceMigrate.run(context);
  } else {
    setCloudFormationOutputInContext(context, {});
  }
};

type EventMap = {
  rootStackName: string,
  rootResources: {key: string}[],
  categories: string[],
  envName: string,
  projectName: string
}

function createInitEventMap(params: ParamType, envName: string, projectName: string): EventMap {
  return {
    rootStackName: params.StackName,
    rootResources: params.Parameters.map(item => {
      const key = item.ParameterKey;
      return {
        key: key.endsWith('Name') ? key.replace(/.{0,4}$/, '') : key,
      };
    }),
    categories: [],
    envName,
    projectName,
  };
}

const processStackCreationData = (context: $TSContext, amplifyAppId: string | undefined, stackDescriptionData: $TSObject): void => {
  const metadata = {};
  if (stackDescriptionData.Stacks && stackDescriptionData.Stacks.length) {
    const { Outputs } = stackDescriptionData.Stacks[0];
    Outputs.forEach((element: $TSObject) => {
      metadata[element.OutputKey] = element.OutputValue;
    });
    if (amplifyAppId) {
      metadata[constants.AmplifyAppIdLabel] = amplifyAppId;
    }

    setCloudFormationOutputInContext(context, metadata);
  } else {
    throw new AmplifyError('StackNotFoundError', {
      message: 'No stack data present',
    });
  }
};

const setCloudFormationOutputInContext = (context: $TSContext, cfnOutput: $TSObject): void => {
  _.set(context, ['exeInfo', 'amplifyMeta', 'providers', constants.ProviderName], cfnOutput);
  const { envName } = context.exeInfo.localEnvInfo;
  if (envName) {
    const providerInfo = _.get(context, ['exeInfo', 'teamProviderInfo', envName, constants.ProviderName]);
    if (providerInfo) {
      _.merge(providerInfo, cfnOutput);
    } else {
      _.set(context, ['exeInfo', 'teamProviderInfo', envName, constants.ProviderName], cfnOutput);
    }
  }
};

const cloneCLIJSONForNewEnvironment = (context: $TSContext): void => {
  if (context.exeInfo.isNewEnv && !context.exeInfo.isNewProject) {
    const { projectPath } = context.exeInfo.localEnvInfo;
    const { envName } = stateManager.getLocalEnvInfo(undefined, {
      throwIfNotExist: false,
      default: {},
    });

    if (envName) {
      const currentEnvCLIJSONPath = pathManager.getCLIJSONFilePath(projectPath, envName);

      if (fs.existsSync(currentEnvCLIJSONPath)) {
        const newEnvCLIJSONPath = pathManager.getCLIJSONFilePath(projectPath, context.exeInfo.localEnvInfo.envName);

        fs.copyFileSync(currentEnvCLIJSONPath, newEnvCLIJSONPath);
      }
    }
  }
};

/**
 * on success init handler
 */
export const onInitSuccessful = async (context: $TSContext): Promise<$TSContext> => {
  configurationManager.onInitSuccessful(context);
  if (context.exeInfo.isNewEnv) {
    await storeRootStackTemplate(context);
    await storeCurrentCloudBackend(context);
    await storeArtifactsForAmplifyService(context);
  }
  return context;
};

/**
 * store the root stack template
 */
export const storeRootStackTemplate = async (context: $TSContext, template?: Template): Promise<void> => {
  // generate template again as the folder structure was not created when root stack was initialized
  if (template === undefined) {
    // eslint-disable-next-line no-param-reassign
    template = await transformRootStack(context);
  }
  // apply Modifiers
  await prePushCfnTemplateModifier(template);
  // RootStack deployed to backend/awscloudformation/build
  const projectRoot = pathManager.findProjectRoot();
  const rootStackBackendBuildDir = pathManager.getRootStackBuildDirPath(projectRoot);
  const rootStackCloudBackendBuildDir = pathManager.getCurrentCloudRootStackDirPath(projectRoot);

  fs.ensureDirSync(rootStackBackendBuildDir);
  const rootStackBackendFilePath = path.join(rootStackBackendBuildDir, rootStackFileName);
  JSONUtilities.writeJson(rootStackBackendFilePath, template, { minify: context.input.options?.minify });
  // copy the awscloudformation backend to #current-cloud-backend
  fs.copySync(path.join(rootStackBackendBuildDir, '..'), path.join(rootStackCloudBackendBuildDir, '..'));
};

const storeCurrentCloudBackend = async (context: $TSContext): Promise<void> => {
  const projectRoot = pathManager.findProjectRoot();
  const zipFilename = '#current-cloud-backend.zip';
  const backendDir = pathManager.getBackendDirPath(projectRoot);
  const tempDir = path.join(backendDir, '.temp');
  const currentCloudBackendDir = context.exeInfo
    ? path.join(context.exeInfo.localEnvInfo.projectPath, PathConstants.AmplifyDirName, PathConstants.CurrentCloudBackendDirName)
    : pathManager.getCurrentCloudBackendDirPath(projectRoot);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const cliJSONFiles = glob.sync(PathConstants.CLIJSONFileNameGlob, {
    cwd: pathManager.getAmplifyDirPath(projectRoot),
    absolute: true,
  });

  // handle tag file
  const tagFilePath = pathManager.getTagFilePath(projectRoot);
  const tagCloudFilePath = pathManager.getCurrentTagFilePath(projectRoot);
  if (fs.existsSync(tagFilePath)) {
    fs.copySync(tagFilePath, tagCloudFilePath, { overwrite: true });
  }

  const zipFilePath = path.normalize(path.join(tempDir, zipFilename));
  const spinner = new AmplifySpinner();

  try {
    spinner.start('Saving deployment state.');
    const archive = await archiver.run(currentCloudBackendDir, zipFilePath, undefined, cliJSONFiles);
    const s3Key = `${archive.zipFilename}`;
    const s3Instance = await S3.getInstance(context);
    const s3Params = {
      Body: fs.createReadStream(archive.zipFilePath),
      Key: s3Key,
    };
    logger('storeCurrentCloudBackend.s3.uploadFile', [{ Key: s3Key }])();
    await s3Instance.uploadFile(s3Params);
    spinner.stop('Deployment state saved successfully.');
  } catch (ex) {
    spinner.stop('Deployment state save failed.', false);
    throw new AmplifyFault('DeploymentFault', {
      message: ex.message,
    }, ex);
  } finally {
    fs.removeSync(tempDir);
  }
};

const storeArtifactsForAmplifyService = async (context: $TSContext): Promise<void> => S3.getInstance(context).then(async s3 => {
  const currentCloudBackendDir = pathManager.getCurrentCloudBackendDirPath();
  const amplifyMetaFilePath = path.join(currentCloudBackendDir, 'amplify-meta.json');
  const backendConfigFilePath = path.join(currentCloudBackendDir, 'backend-config.json');
  const fileUploadTasks = [];

  fileUploadTasks.push(() => uploadFile(s3, amplifyMetaFilePath, 'amplify-meta.json'));
  fileUploadTasks.push(() => uploadFile(s3, backendConfigFilePath, 'backend-config.json'));
  await sequential(fileUploadTasks);
});

const uploadFile = async (s3, filePath: string, key): Promise<void> => {
  if (fs.existsSync(filePath)) {
    const s3Params = {
      Body: fs.createReadStream(filePath),
      Key: key,
    };
    logger('uploadFile.s3.uploadFile', [{ Key: key }])();
    await s3.uploadFile(s3Params);
  }
};

const normalizeStackName = (stackName: string): string => {
  let result = stackName.toLowerCase().replace(/[^-a-z0-9]/g, '');
  if (/^[^a-zA-Z]/.test(result) || result.length === 0) {
    result = `a${result}`;
  }
  return result;
};
