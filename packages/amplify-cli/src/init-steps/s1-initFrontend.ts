import { $TSAny, $TSContext } from 'amplify-cli-core';
import * as inquirer from 'inquirer';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { normalizeFrontendHandlerName } from '../input-params-manager';

export async function initFrontend(context: $TSContext) {
  if (!context.exeInfo.isNewProject) {
    const currentProjectConfig = context.amplify.getProjectConfig();
    Object.assign(currentProjectConfig, context.exeInfo.projectConfig);
    context.exeInfo.projectConfig = currentProjectConfig;
    return context;
  }

  const frontendPlugins = getFrontendPlugins(context);
  const suitableFrontend = getSuitableFrontend(context, frontendPlugins, context.exeInfo.localEnvInfo.projectPath);
  const frontend = await getFrontendHandler(context, frontendPlugins, suitableFrontend);

  context.exeInfo.projectConfig.frontend = frontend;
  const frontendModule = require(frontendPlugins[frontend]);
  await frontendModule.init(context);

  return context;
}

export function getSuitableFrontend(context: $TSContext, frontendPlugins: $TSAny, projectPath: string) {
  let headlessFrontend = context?.exeInfo?.inputParams?.amplify?.frontend;

  if (headlessFrontend && headlessFrontend in frontendPlugins) {
    return headlessFrontend;
  }

  let suitableFrontend;
  let fitToHandleScore = -1;

  Object.keys(frontendPlugins).forEach(key => {
    const { scanProject } = require(frontendPlugins[key]);
    const newScore = scanProject(projectPath);
    if (newScore > fitToHandleScore) {
      fitToHandleScore = newScore;
      suitableFrontend = key;
    }
  });
  return suitableFrontend;
}

async function getFrontendHandler(context: $TSContext, frontendPlugins: $TSAny, suitableFrontend: string) {
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
    const selectFrontendHandler: inquirer.ListQuestion = {
      type: 'list',
      name: 'selectedFrontendHandler',
      message: "Choose the type of app that you're building",
      choices: frontendPluginList,
      default: suitableFrontend,
    };
    const answer = await inquirer.prompt(selectFrontendHandler);
    frontend = answer.selectedFrontendHandler;
  }

  return frontend;
}
