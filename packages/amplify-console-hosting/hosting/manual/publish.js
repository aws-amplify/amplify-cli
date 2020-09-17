const path = require('path');
const fs = require('fs-extra');
const utils = require('../../utils/amplify-context-utils');
const builder = require('../../utils/build-utils');
const clientFactory = require('../../utils/client-factory');
const amplifyUtils = require('../../utils/amplify-console-utils');
const constants = require('../../constants/plugin-constants');
const ora = require('ora');

const ZIPPING_MESSAGE = 'Zipping artifacts.. ';
const ZIPPING_SUCCESS_MESSAGE = 'Zipping artifacts completed.';
const ZIPPING_FAILURE_MESSAGE = 'Zipping artifacts failed.';


async function publish(context, doSkipBuild, doSkipPush) {
  let artifactsPath = null;
  try {
    if (!doSkipPush) {
      await context
        .amplify
        .pushResources(context, constants.CATEGORY, constants.CONSOLE_RESOURCE_NAME);
    }
    if (!doSkipBuild) {
      await buildArtifacts(context);
    }
    const amplifyClient = await clientFactory.getAmplifyClient(context);
    const appId = utils.getAppIdForCurrEnv(context);
    const env = utils.getCurrEnv(context);
    const spinner = ora();
    spinner.start(ZIPPING_MESSAGE);
    artifactsPath = await zipArtifacts(context).catch((err) => {
      spinner.fail(ZIPPING_FAILURE_MESSAGE);
      throw err;
    });
    spinner.succeed(ZIPPING_SUCCESS_MESSAGE);
    await amplifyUtils.publishFileToAmplify(appId, env, artifactsPath, amplifyClient);
    console.log(amplifyUtils.getDefaultDomainForBranch(appId, env));
  } finally {
    if (artifactsPath) {
      fs.removeSync(artifactsPath);
    }
  }
}

async function buildArtifacts(context) {
  const projectConfig = utils.getProjectConfig(context);
  const { projectPath } = utils.getLocalEnvInfo(context);
  const { BuildCommand } = projectConfig[projectConfig.frontend].config;
  await builder.run(BuildCommand, projectPath);
}

async function zipArtifacts(context) {
  const projectConfig = utils.getProjectConfig(context);
  const frontendConfig = projectConfig[projectConfig.frontend].config;
  const { projectPath } = utils.getLocalEnvInfo(context);
  const buildPath = path.join(projectPath, frontendConfig.DistributionDir);
  const now = new Date();
  const zipFilePath = path.join(projectPath, `${now.getTime()}.zip`);
  return await builder.zipFile(buildPath, zipFilePath);
}

module.exports = {
  publish,
};
