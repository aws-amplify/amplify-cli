import { getInvoker } from 'amplify-category-function';
import * as path from 'path';
import * as inquirer from 'inquirer';
import { loadMinimalLambdaConfig } from '../utils/lambda/loadMinimal';
import { hydrateAllEnvVars } from '../utils';

export async function start(context) {
  if (!context.input.subCommands || context.input.subCommands.length < 1) {
    throw new Error('Specify the function name to invoke with "amplify mock function <function name>"');
  }

  const resourceName = context.input.subCommands[0];
  const { amplify } = context;
  const resourcePath = path.join(amplify.pathManager.getBackendDirPath(), 'function', resourceName);
  const resourceQuestions = [
    {
      type: 'input',
      name: 'eventName',
      message: `Provide the path to the event JSON object relative to ${resourcePath}`,
      validate: amplify.inputValidation({
        operator: 'regex',
        value: '^[a-zA-Z0-9/._-]+?\\.json$',
        onErrorMsg: 'Provide a valid unix-like path to a .json file',
        required: true,
      }),
      default: 'src/event.json',
    },
  ];
  const resourceAnswers = await inquirer.prompt(resourceQuestions);
  const event = amplify.readJsonFile(path.resolve(path.join(resourcePath, resourceAnswers.eventName as string)));
  const lambdaConfig = loadMinimalLambdaConfig(context, resourceName);
  if (!lambdaConfig || !lambdaConfig.handler) {
    throw new Error(`Could not parse handler for ${resourceName} from cloudformation file`);
  }
  const { allResources } = await context.amplify.getResourceStatus();

  const envVars = hydrateAllEnvVars(allResources, lambdaConfig.environment);
  const invoker = await getInvoker(context, { resourceName, handler: lambdaConfig.handler, envVars });
  context.print.success('Starting execution...');
  await invoker({ event })
    .then(result => {
      const msg = typeof result === 'object' ? JSON.stringify(result) : result;
      context.print.success('Result:');
      console.log(typeof result === 'undefined' ? '' : msg);
    })
    .catch(error => {
      context.print.error(`${resourceName} failed with the following error:`);
      console.error(error);
    })
    .then(() => context.print.success('Finished execution.'));
}
