import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { normalizeFrontendHandlerName } from '../input-params-manager';
import { byValue, prompter } from '@aws-amplify/amplify-prompts';

export async function configFrontendHandler(context) {
  const frontendPlugins = getFrontendPlugins(context);
  const { frontend } = context.exeInfo.projectConfig;

  const selectedFrontend = await selectFrontendHandler(context, frontendPlugins, frontend);

  if (selectedFrontend !== frontend) {
    delete context.exeInfo.projectConfig[frontend];
    const frontendModule = await import(frontendPlugins[selectedFrontend]);
    await frontendModule.init(context);
    context.exeInfo.projectConfig.frontend = selectedFrontend;
  } else {
    const frontendModule = await import(frontendPlugins[selectedFrontend]);
    await frontendModule.configure(context);
  }

  return context;
}

async function selectFrontendHandler(context, frontendPlugins, currentFrontend) {
  let frontend;
  const frontendPluginList = Object.keys(frontendPlugins);
  const { inputParams } = context.exeInfo;
  if (inputParams.amplify.frontend) {
    frontend = normalizeFrontendHandlerName(inputParams.amplify.frontend, frontendPluginList);
  }

  if (!frontend && inputParams.yes) {
    frontend = 'javascript';
  }

  if (!frontend) {
    frontend = prompter.pick("Choose the type of app that you're building", frontendPluginList, {
      initial: byValue(currentFrontend),
    });
  }

  return frontend;
}
