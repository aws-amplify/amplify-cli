import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import * as inquirer from 'inquirer';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { normalizeFrontendHandlerName } from '../input-params-manager';

/**
 * Initializes the frontend
 */
export const initFrontend = async (context: $TSContext): Promise<$TSContext> => {
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
  const frontendModule = await import(frontendPlugins[frontend]);
  await frontendModule.init(context);

  return context;
};

/**
 * Returns the suitable frontend for the project
 */
export const getSuitableFrontend = (context: $TSContext, frontendPlugins: $TSAny, projectPath: string): string => {
  const headlessFrontend = context?.exeInfo?.inputParams?.amplify?.frontend;

  if (headlessFrontend && headlessFrontend in frontendPlugins) {
    return headlessFrontend;
  }

  let suitableFrontend;
  let fitToHandleScore = -1;

  Object.keys(frontendPlugins).forEach((key) => {
    // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
    const { scanProject } = require(frontendPlugins[key]);
    const newScore = scanProject(projectPath);
    if (newScore > fitToHandleScore) {
      fitToHandleScore = newScore;
      suitableFrontend = key;
    }
  });
  return suitableFrontend;
};

const getFrontendHandler = async (context: $TSContext, frontendPlugins: $TSAny, suitableFrontend: string): Promise<string> => {
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
};
