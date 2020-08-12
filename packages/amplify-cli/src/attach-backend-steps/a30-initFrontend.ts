import * as inquirer from 'inquirer';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { normalizeFrontendHandlerName } from '../input-params-manager';
import { ListQuestion } from 'inquirer';

export async function initFrontend(context) {
  if (
    context.exeInfo.inputParams &&
    context.exeInfo.inputParams.yes &&
    context.exeInfo.existingProjectConfig &&
    context.exeInfo.existingProjectConfig.frontend
  ) {
    context.exeInfo.projectConfig = context.exeInfo.existingProjectConfig;
  } else {
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
  }

  return context;
}

async function getFrontendHandler(context, frontendPlugins, suitableFrontend) {
  let frontend;
  const frontendPluginList = Object.keys(frontendPlugins);
  const { inputParams } = context.exeInfo;

  if (inputParams && inputParams.amplify && inputParams.amplify.frontend) {
    frontend = normalizeFrontendHandlerName(inputParams.amplify.frontend, frontendPluginList);
  }

  if (!frontend && inputParams && inputParams.yes) {
    frontend = 'javascript';
  }

  if (!frontend) {
    const selectFrontendHandler: ListQuestion<{ selectedFrontendHandler: string }> = {
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
