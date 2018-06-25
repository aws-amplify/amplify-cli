const path = require('path');
const { getFrontendPlugins } = require('../../extensions/amplify-helpers/get-frontend-plugins');

function run(context) {
  return new Promise((resolve) => {
    const projectPath = process.cwd();
    const projectName = path.basename(projectPath);
    context.initInfo = {
      projectPath,
      projectName,
    };

    context.initInfo.projectConfig = {
      projectName: context.initInfo.projectName,
      projectPath: context.initInfo.projectPath,
    };

    context.initInfo.metaData = {
    };

    scanWithFrontendHandlers(context);

    resolve(context);
  });
}

function scanWithFrontendHandlers(context) {
  const frontendPlugins = getFrontendPlugins(context);
  let suitableHandler;
  let fitToHandleScore = -1;
  Object.keys(frontendPlugins).forEach((key) => {
    const { scanProject } = require(frontendPlugins[key]);
    const newScore = scanProject(context);
    if (newScore > fitToHandleScore) {
      fitToHandleScore = newScore;
      suitableHandler = key;
    }
  });

  context.initInfo.frontendPlugins = frontendPlugins;
  context.initInfo.suitableHandler = suitableHandler;

  return suitableHandler;
}

module.exports = {
  run,
};
