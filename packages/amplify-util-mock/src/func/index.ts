import { getInvoker, category, isMockable } from 'amplify-category-function';
import * as path from 'path';
import * as inquirer from 'inquirer';
import { loadMinimalLambdaConfig } from '../utils/lambda/loadMinimal';
import { hydrateAllEnvVars } from '../utils';

export async function start(context) {
  if (!context.input.subCommands || context.input.subCommands.length < 1) {
    throw new Error('Specify the function name to invoke with "amplify mock function <function name>"');
  }

  const resourceName = context.input.subCommands[0];
  // check that the resource is mockable
  const mockable = isMockable(context, resourceName);
  if (!mockable.isMockable) {
    throw new Error(`Unable to mock ${resourceName}. ${mockable.reason}`);
  }
  const { amplify } = context;
  const resourcePath = path.join(amplify.pathManager.getBackendDirPath(), category, resourceName);
  const eventNameValidator = amplify.inputValidation({
    operator: 'regex',
    value: '^[a-zA-Z0-9/._-]+?\\.json$',
    onErrorMsg: 'Provide a valid unix-like path to a .json file',
    required: true,
  });
  let eventName: string = context.input.options ? context.input.options.event : undefined;
  let promptForEvent = true;
  if (eventName) {
    const validatorOutput = eventNameValidator(eventName);
    const isValid = typeof validatorOutput !== 'string';
    if (!isValid) {
      context.print.warning(validatorOutput);
    } else {
      promptForEvent = false;
    }
  }

  if (promptForEvent) {
    const resourceQuestions = [
      {
        type: 'input',
        name: 'eventName',
        message: `Provide the path to the event JSON object relative to ${resourcePath}`,
        validate: eventNameValidator,
        default: 'src/event.json',
      },
    ];
    const resourceAnswers = await inquirer.prompt(resourceQuestions);
    eventName = resourceAnswers.eventName as string;
  }

  const event = amplify.readJsonFile(path.resolve(path.join(resourcePath, eventName)));
  const lambdaConfig = loadMinimalLambdaConfig(context, resourceName, { env: context.amplify.getEnvInfo().envName });
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
      context.print.info(typeof result === 'undefined' ? '' : msg);
    })
    .catch(error => {
      context.print.error(`${resourceName} failed with the following error:`);
      context.print.info(error);
    })
    .then(() => context.print.success('Finished execution.'));
}
