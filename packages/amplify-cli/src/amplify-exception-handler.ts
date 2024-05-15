import { EOL } from 'os';
import {
  $TSAny,
  AmplifyException,
  AmplifyFaultType,
  AmplifyFault,
  executeHooks,
  HooksMeta,
  isWindowsPlatform,
  AmplifyError,
} from '@aws-amplify/amplify-cli-core';
import { getAmplifyLogger } from '@aws-amplify/amplify-cli-logger';
import { AmplifyPrinter, printer } from '@aws-amplify/amplify-prompts';
import { reportError } from './commands/diagnose';
import { isHeadlessCommand } from './context-manager';
import { Context } from './domain/context';

let context: Context;

/**
 * Inject a reference to the context object into this module
 */
export const init = (_context: Context): void => {
  context = _context;
};

/**
 * Handle exceptions
 */
export const handleException = async (exception: unknown): Promise<void> => {
  process.exitCode = 1;
  let amplifyException: AmplifyException;

  if (exception instanceof AmplifyException) {
    amplifyException = exception;
  } else if (!(exception instanceof Error)) {
    amplifyException = unknownErrorToAmplifyException(exception);
  } else if (isNodeJsError(exception)) {
    amplifyException = nodeErrorToAmplifyException(exception);
  } else {
    amplifyException = genericErrorToAmplifyException(exception);
  }

  const deepestException = getDeepestAmplifyException(amplifyException);
  if (context && isHeadlessCommand(context)) {
    printHeadlessAmplifyException(deepestException);
  } else {
    printAmplifyException(deepestException);
  }

  if (context?.usageData) {
    await executeSafely(async () => {
      await context?.usageData.emitError(deepestException);
      printer.blankLine();
      printer.info(`Session Identifier: ${context?.usageData.getSessionUuid()}`);
    }, 'Failed to emit error to usage data');
  }

  // Swallow and continue if any operations fail
  if (context) {
    await executeSafely(() => reportError(context, deepestException), 'Failed to report error');
  }

  await executeSafely(
    () =>
      executeHooks(
        HooksMeta.getInstance(undefined, 'post', {
          message: deepestException.message ?? 'undefined error in Amplify process',
          stack: deepestException.stack ?? 'undefined error stack',
        }),
      ),
    'Failed to execute hooks',
  );

  await executeSafely(
    () =>
      getAmplifyLogger().logError({
        message: deepestException.message,
        error: deepestException,
      }),
    'Failed to log error',
  );

  process.exit(1);
};

/**
 * Handle rejected promises that weren't caught or awaited anywhere in the code.
 */
export const handleUnhandledRejection = (reason: Error | $TSAny): void => {
  if (reason instanceof Error) {
    throw reason;
  } else if (reason !== null && typeof reason === 'string') {
    throw new Error(reason);
  } else if (reason !== null) {
    throw new Error(JSON.stringify(reason));
  } else {
    throw new Error('Unhandled promise rejection');
  }
};

const getDeepestAmplifyException = (amplifyException: AmplifyException): AmplifyException => {
  let deepestAmplifyException = amplifyException;
  while (deepestAmplifyException.downstreamException && deepestAmplifyException.downstreamException instanceof AmplifyException) {
    deepestAmplifyException = deepestAmplifyException.downstreamException;
  }
  return deepestAmplifyException;
};

/**
 * Utility function to ensure a passed in function does not invoke the exception handler to avoid an infinite loop
 *
 * @param functionToExecute - the function that should be executed, but never reject
 * @param errorMessagePrefix - error message prefix before the thrown error is printed
 */
const executeSafely = async (functionToExecute: () => Promise<void> | void, errorMessagePrefix: string): Promise<void> => {
  try {
    await functionToExecute();
  } catch (e) {
    // Log the error, but do not reject the promise
    printer.error(`${errorMessagePrefix}: ${e?.message || e}`);
  }
};

const printAmplifyException = (amplifyException: AmplifyException): void => {
  const { message, details, resolution, link, stack } = amplifyException;
  if (details) {
    printer.error(message + EOL + details);
  } else {
    printer.error(message);
  }
  printer.blankLine();
  if (resolution) {
    printer.info(`Resolution: ${resolution}`);
  }
  if (link) {
    printer.info(`Learn more at: ${link}`);
  }

  if (stack) {
    printer.debug('');
    printer.debug(stack);
  }

  if (amplifyException.downstreamException) {
    printError(amplifyException.downstreamException);
  }
};

const printError = (err: Error): void => {
  printer.debug('');
  printer.debug(err.message);
  if (err.stack) {
    printer.debug(err.stack);
  }
};

const printHeadlessAmplifyException = (amplifyException: AmplifyException): void => {
  const errorPrinter = new AmplifyPrinter(process.stderr);
  errorPrinter.error(JSON.stringify(amplifyException.toObject()));
};

const unknownErrorToAmplifyException = (err: unknown): AmplifyException =>
  new AmplifyFault(unknownErrorTypeToAmplifyExceptionType(), {
    message: typeof err === 'object' && err !== null && 'message' in err ? (err as $TSAny).message : 'Unknown error',
    resolution: genericFaultResolution,
  });

const genericErrorToAmplifyException = (err: Error): AmplifyException =>
  new AmplifyFault(
    genericErrorTypeToAmplifyExceptionType(),
    {
      message: err.message,
      resolution: genericFaultResolution,
    },
    err,
  );

const nodeErrorToAmplifyException = (err: NodeJS.ErrnoException): AmplifyException => {
  if (!isWindowsPlatform() && err.code === 'EACCES') {
    let path = err.path;
    if (err.message.includes('/.amplify/')) {
      path = '~/.amplify';
    } else if (err.message.includes('/.aws/amplify/')) {
      path = '~/.aws/amplify';
    } else if (err.message.includes('/amplify/')) {
      path = '<your amplify app directory>';
    }
    return new AmplifyError(
      'FileSystemPermissionsError',
      { message: err.message, resolution: `Try running 'sudo chown -R $(whoami):$(id -gn) ${path}' to fix this` },
      err,
    );
  }
  return new AmplifyFault(
    nodeErrorTypeToAmplifyExceptionType(),
    {
      message: err.message,
      resolution: genericFaultResolution,
      code: err.code,
    },
    err,
  );
};

const nodeErrorTypeToAmplifyExceptionType = (): AmplifyFaultType => 'UnknownNodeJSFault';
const genericErrorTypeToAmplifyExceptionType = (): AmplifyFaultType => 'UnknownFault';
const unknownErrorTypeToAmplifyExceptionType = (): AmplifyFaultType => 'UnknownFault';

const genericFaultResolution = `Please report this issue at https://github.com/aws-amplify/amplify-cli/issues and include the project identifier from: 'amplify diagnose --send-report'`;

const isNodeJsError = (err: Error): err is NodeJS.ErrnoException => (err as $TSAny).code !== undefined;
