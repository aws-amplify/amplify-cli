const path = require('path');
const fs = require('fs-extra');
const utils = require('../../utils/amplify-context-utils');
const builder = require('../../utils/build-utils');
const clientFactory = require('../../utils/client-factory');
const amplifyUtils = require('../../utils/amplify-console-utils');
const constants = require('../../constants/plugin-constants');

async function publish(context, doSkipBuild) {
  let artifactsPath = null;
  try {
    if (doSkipBuild) {
      await context
        .amplify
        .pushResources(context, constants.CATEGORY, constants.CONSOLE_RESOURCE_NAME);
      await buildArtifacts(context);
    }
    const amplifyClient = await clientFactory.getAmplifyClient(context);
    const appId = utils.getAppIdForCurrEnv(context);
    const env = utils.getCurrEnv(context);
    artifactsPath = await zipArtifacts(context);
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
  return await builder.zipFile(buildPath, projectPath);
}

module.exports = {
  publish,
};
