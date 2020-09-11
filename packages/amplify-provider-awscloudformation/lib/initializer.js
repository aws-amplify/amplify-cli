const moment = require('moment');
const path = require('path');
const { pathManager, PathConstants, stateManager } = require('amplify-cli-core');
const glob = require('glob');
const archiver = require('../src/utils/archiver');
const fs = require('fs-extra');
const ora = require('ora');
const sequential = require('promise-sequential');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const S3 = require('../src/aws-utils/aws-s3');
const constants = require('./constants');
const configurationManager = require('./configuration-manager');
const amplifyServiceManager = require('./amplify-service-manager');
const amplifyServiceMigrate = require('./amplify-service-migrate');

async function run(context) {
  await configurationManager.init(context);
  if (!context.exeInfo || context.exeInfo.isNewEnv) {
    context.exeInfo = context.exeInfo || {};
    const { projectName } = context.exeInfo.projectConfig;
    const initTemplateFilePath = path.join(__dirname, 'rootStackTemplate.json');
    const timeStamp = `${moment().format('Hmmss')}`;
    const { envName = '' } = context.exeInfo.localEnvInfo;
    let stackName = normalizeStackName(`amplify-${projectName}-${envName}-${timeStamp}`);
    const awsConfig = await configurationManager.getAwsConfig(context);

    const amplifyServiceParams = {
      context,
      awsConfig,
      projectName,
      envName,
      stackName,
    };
    const { amplifyAppId, verifiedStackName, deploymentBucketName } = await amplifyServiceManager.init(amplifyServiceParams);

    stackName = verifiedStackName;
    const authRoleName = `${stackName}-authRole`;
    const unauthRoleName = `${stackName}-unauthRole`;
    const params = {
      StackName: stackName,
      Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
      TemplateBody: fs.readFileSync(initTemplateFilePath).toString(),
      Parameters: [
        {
          ParameterKey: 'DeploymentBucketName',
          ParameterValue: deploymentBucketName,
        },
        {
          ParameterKey: 'AuthRoleName',
          ParameterValue: authRoleName,
        },
        {
          ParameterKey: 'UnauthRoleName',
          ParameterValue: unauthRoleName,
        },
      ],
    };

    const spinner = ora();
    spinner.start('Initializing project in the cloud...');

    try {
      const cfnItem = await new Cloudformation(context, 'init', awsConfig);
      const stackDescriptionData = await cfnItem.createResourceStack(params);

      processStackCreationData(context, amplifyAppId, stackDescriptionData);
      cloneCLIJSONForNewEnvironment(context);

      spinner.succeed('Successfully created initial AWS cloud resources for deployments.');

      return context;
    } catch (e) {
      spinner.fail('Root stack creation failed');
      throw e;
    }
  } else if (
    // This part of the code is invoked by the `amplify init --appId xxx` command
    // on projects that are already fully setup by `amplify init` with the Amplify CLI version prior to 4.0.0.
    // It expects all the artifacts in the `amplify/.config` directory, the amplify-meta.json file in both
    // the `#current-cloud-backend` and the `backend` directories, and the team-provider-info file to exist.
    // It allows the local project's env to be added to an existing Amplify Console project, as specified
    // by the appId, without unneccessarily creating another Amplify Console project by the post push migration.
    !context.exeInfo.isNewProject &&
    context.exeInfo.inputParams &&
    context.exeInfo.inputParams.amplify &&
    context.exeInfo.inputParams.amplify.appId
  ) {
    await amplifyServiceMigrate.run(context);
  }
}

function processStackCreationData(context, amplifyAppId, stackDescriptiondata) {
  const metadata = {};
  const { Outputs } = stackDescriptiondata.Stacks[0];
  Outputs.forEach(element => {
    metadata[element.OutputKey] = element.OutputValue;
  });
  if (amplifyAppId) {
    metadata[constants.AmplifyAppIdLabel] = amplifyAppId;
  }

  context.exeInfo.amplifyMeta = {};
  if (!context.exeInfo.amplifyMeta.providers) {
    context.exeInfo.amplifyMeta.providers = {};
  }
  context.exeInfo.amplifyMeta.providers[constants.ProviderName] = metadata;

  if (context.exeInfo.isNewEnv) {
    const { envName } = context.exeInfo.localEnvInfo;
    context.exeInfo.teamProviderInfo[envName] = {};
    context.exeInfo.teamProviderInfo[envName][constants.ProviderName] = metadata;
  }
}

function cloneCLIJSONForNewEnvironment(context) {
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
}

async function onInitSuccessful(context) {
  configurationManager.onInitSuccessful(context);
  if (context.exeInfo.isNewEnv) {
    context = await storeCurrentCloudBackend(context);
    await storeArtifactsForAmplifyService(context);
  }
  return context;
}

function storeCurrentCloudBackend(context) {
  const zipFilename = '#current-cloud-backend.zip';
  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const tempDir = path.join(backendDir, '.temp');
  const currentCloudBackendDir = context.exeInfo
    ? path.join(context.exeInfo.localEnvInfo.projectPath, PathConstants.AmplifyDirName, PathConstants.CurrentCloudBackendDirName)
    : context.amplify.pathManager.getCurrentCloudBackendDirPath();

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const cliJSONFiles = glob.sync(PathConstants.CLIJSONFileNameGlob, {
    cwd: pathManager.getAmplifyDirPath(),
    absolute: true,
  });

  const zipFilePath = path.normalize(path.join(tempDir, zipFilename));
  return archiver
    .run(currentCloudBackendDir, zipFilePath, undefined, cliJSONFiles)
    .then(result => {
      const s3Key = `${result.zipFilename}`;
      return new S3(context).then(s3 => {
        const s3Params = {
          Body: fs.createReadStream(result.zipFilePath),
          Key: s3Key,
        };
        return s3.uploadFile(s3Params);
      });
    })
    .then(() => {
      fs.removeSync(tempDir);
      return context;
    });
}

function storeArtifactsForAmplifyService(context) {
  return new S3(context).then(async s3 => {
    const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
    const amplifyMetaFilePath = path.join(currentCloudBackendDir, 'amplify-meta.json');
    const backendConfigFilePath = path.join(currentCloudBackendDir, 'backend-config.json');
    const fileUploadTasks = [];

    fileUploadTasks.push(() => uploadFile(s3, amplifyMetaFilePath, 'amplify-meta.json'));
    fileUploadTasks.push(() => uploadFile(s3, backendConfigFilePath, 'backend-config.json'));
    await sequential(fileUploadTasks);
  });
}

async function uploadFile(s3, filePath, key) {
  if (fs.existsSync(filePath)) {
    const s3Params = {
      Body: fs.createReadStream(filePath),
      Key: key,
    };
    await s3.uploadFile(s3Params);
  }
}

function normalizeStackName(stackName) {
  let result = stackName.toLowerCase().replace(/[^-a-z0-9]/g, '');
  if (/^[^a-zA-Z]/.test(result) || result.length === 0) {
    result = `a${result}`;
  }
  return result;
}

module.exports = {
  run,
  onInitSuccessful,
};
