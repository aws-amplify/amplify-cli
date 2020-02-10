const constants = require('../../constants/plugin-constants');
const path = require('path');
const pathManager = require('../../utils/path-manager');
const fs = require('fs-extra');
const utils = require('../../utils/amplify-context-utils');
const builder = require('../../utils/build-utils');
const clientFactory = require('../../utils/client-factory');
const amplifyUtils = require('../../utils/amplify-console-utils');


async function publish(context) {
    let artifactsPath = null;
    try {
        const amplifyClient = await clientFactory.getAmplifyClient(context);
        const appId = utils.getAppIdForCurrEnv(context);
        const env = utils.getCurrEnv(context);
        artifactsPath = await buildAndGetArtifactsPath(context);
        await amplifyUtils.publishFileToAmplify(appId, env, artifactsPath, amplifyClient);
        console.log(amplifyUtils.getDefaultDomainForBranch(appId, env));
    } finally {
        if (artifactsPath) {
            fs.removeSync(artifactsPath);
        } 
    }
}

async function buildAndGetArtifactsPath(context) {
    const projectConfig = utils.getProjectConfig(context);
    const frontendConfig = projectConfig[projectConfig.frontend].config;
    const projectPath = utils.getLocalEnvInfo(context).projectPath;
    const buildPath = path.join(projectPath, frontendConfig.DistributionDir);
    const buildCmd = projectConfig[projectConfig.frontend].config.BuildCommand;
    await builder.run(buildCmd, projectPath);
    return await builder.zipFile(buildPath, projectPath);
}

module.exports = {
    publish
}