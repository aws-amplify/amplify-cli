import * as inquirer from 'inquirer';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { normalizeFrontendHandlerName } from '../input-params-manager';
import { frontendSelect } from '../prompts';

export async function initFrontend(context) {
  if (!context.exeInfo.isNewProject) {
    const currentProjectConfig = context.amplify.getProjectConfig();
    Object.assign(currentProjectConfig, context.exeInfo.projectConfig);
    context.exeInfo.projectConfig = currentProjectConfig;
    return context;
  }

  const frontendPlugins = getFrontendPlugins(context);
  let suitableFrontend;
  let fitToHandleScore = -1;

  Object.keys(frontendPlugins).forEach(key => {
    const { scanProject } = require(frontendPlugins[key]);
    const newScore = scanProject(context.exeInfo.localEnvInfo.projectPath);
    if (newScore > fitToHandleScore) {
      fitToHandleScore = newScore;
      suitableFrontend = key;
    }
  });

  const frontend = await getFrontendHandler(context, frontendPlugins, suitableFrontend);

  context.exeInfo.projectConfig.frontend = frontend;
  const frontendModule = require(frontendPlugins[frontend]);
  await frontendModule.init(context);

  return context;
}

async function getFrontendHandler(context, frontendPlugins, suitableFrontend) {
  let frontend;
  const frontendPluginList = Object.keys(frontendPlugins);
  const { inputParams } = context.exeInfo;
  if (inputParams && inputParams.amplify.frontend) {
    frontend = normalizeFrontendHandlerName(inputParams.amplify.frontend, frontendPluginList);
  }

  if (!frontend && inputParams && inputParams.yes) {
    frontend = 'javascript';
  }

  if (!frontend) {
    frontend = await frontendSelect(frontendPluginList, suitableFrontend);
  }

  return frontend;
}
