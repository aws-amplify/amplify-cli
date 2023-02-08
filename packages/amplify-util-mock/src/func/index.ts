import { getInvoker, category, isMockable, getBuilder } from '@aws-amplify/amplify-category-function';
import * as path from 'path';
import * as inquirer from 'inquirer';
import { $TSContext, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import _ from 'lodash';
import { BuildType } from 'amplify-function-plugin-interface';
import { loadLambdaConfig } from '../utils/lambda/load-lambda-config';

const DEFAULT_TIMEOUT_SECONDS = 10;

export async function start(context: $TSContext) {
  const ampMeta = stateManager.getMeta();
  let resourceName = context?.input?.subCommands?.[0];
  if (!resourceName) {
    const choices = _.keys(_.get(ampMeta, ['function'])).filter(resourceName => isMockable(context, resourceName).isMockable);
    if (choices.length < 1) {
      throw new Error('There are no mockable functions in the project. Use `amplify add function` to create one.');
    } else if (choices.length == 1) {
      resourceName = choices[0];
    } else {
      const resourceNameQuestion = [
        {
          type: 'list',
          name: 'resourceName',
          message: 'Select the function to mock',
          choices,
        },
      ];
      ({ resourceName } = await inquirer.prompt<{ resourceName: string }>(resourceNameQuestion));
    }
  } else {
    const mockable = isMockable(context, resourceName);
    if (!mockable.isMockable) {
      throw new Error(`Unable to mock ${resourceName}. ${mockable.reason}`);
    }
  }

  const event = await resolveEvent(context, resourceName);
  const lambdaConfig = await loadLambdaConfig(context, resourceName);
  if (!lambdaConfig?.handler) {
    throw new Error(`Could not parse handler for ${resourceName} from cloudformation file`);
  }
  context.print.blue('Ensuring latest function changes are built...');
  await getBuilder(context, resourceName, BuildType.DEV)();
  const invoker = await getInvoker(context, { resourceName, handler: lambdaConfig.handler, envVars: lambdaConfig.environment });
  context.print.blue('Starting execution...');
  try {
    const result = await timeConstrainedInvoker(invoker({ event }), context.input.options);
    const stringResult =
      typeof result === 'object' ? JSON.stringify(result, undefined, 2) : typeof result === 'undefined' ? 'undefined' : result;
    context.print.success('Result:');
    context.print.info(typeof result === 'undefined' ? '' : stringResult);
  } catch (err) {
    context.print.error(`${resourceName} failed with the following error:`);
    context.print.info(err);
  } finally {
    context.print.blue('Finished execution.');
  }
}

interface InvokerOptions {
  timeout?: string;
}
export const timeConstrainedInvoker = async <T>(promise: Promise<T>, options?: InvokerOptions): Promise<T> => {
  const { timer, cancel } = getCancellableTimer(options);
  try {
    return await Promise.race([promise, timer]);
  } finally {
    cancel();
  }
};

const getCancellableTimer = ({ timeout }: InvokerOptions = {}) => {
  const inputTimeout = Number.parseInt(timeout, 10);
  const lambdaTimeoutSeconds = !!inputTimeout && inputTimeout > 0 ? inputTimeout : DEFAULT_TIMEOUT_SECONDS;
  const timeoutErrorMessage = `Lambda execution timed out after ${lambdaTimeoutSeconds} seconds. Press ctrl + C to exit the process.
    To increase the lambda timeout use the --timeout parameter to set a value in seconds.
    Note that the maximum Lambda execution time is 15 minutes:
    https://aws.amazon.com/about-aws/whats-new/2018/10/aws-lambda-supports-functions-that-can-run-up-to-15-minutes/\n`;
  let timeoutObj;
  const timer = new Promise<never>((_, reject) => {
    timeoutObj = setTimeout(() => reject(new Error(timeoutErrorMessage)), lambdaTimeoutSeconds * 1000);
  });
  const cancel = () => clearTimeout(timeoutObj);
  return { timer, cancel };
};

const resolveEvent = async (context: $TSContext, resourceName: string): Promise<unknown> => {
  const { amplify } = context;
  const resourcePath = path.join(pathManager.getBackendDirPath(), category, resourceName);
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
      context.print.warning(validatorOutput as string);
    } else {
      promptForEvent = false;
    }
  }

  if (promptForEvent) {
    const eventNameQuestion = [
      {
        type: 'input',
        name: 'eventName',
        message: `Provide the path to the event JSON object relative to ${resourcePath}`,
        validate: eventNameValidator,
        default: 'src/event.json',
      },
    ];
    const resourceAnswers = await inquirer.prompt(eventNameQuestion);
    eventName = resourceAnswers.eventName as string;
  }

  return JSONUtilities.readJson(path.resolve(path.join(resourcePath, eventName)));
};

interface InvokerOptions {
  timeout?: string;
}
