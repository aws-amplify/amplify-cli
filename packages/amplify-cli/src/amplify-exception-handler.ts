import {
  $TSAny,
  AmplifyException,
  AmplifyFaultType,
  AmplifyFault,
  executeHooks,
  HooksMeta,
  isWindowsPlatform,
} from 'amplify-cli-core';
import { getAmplifyLogger } from 'amplify-cli-logger';
import { AmplifyPrinter, printer } from 'amplify-prompts';
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
    await executeSafely(
      () => {
        context?.usageData.emitError(deepestException);
        printer.blankLine();
        printer.info(`Session Identifier: ${context?.usageData.getSessionUuid()}`);
      }, 'Failed to emit error to usage data',
    );
  }

  // Swallow and continue if any operations fail
  if (context) {
    await executeSafely(() => reportError(context, deepestException), 'Failed to report error');
  }

  await executeSafely(
    () => executeHooks(HooksMeta.getInstance(undefined, 'post', {
      message: deepestException.message ?? 'undefined error in Amplify process',
      stack: deepestException.stack ?? 'undefined error stack',
    })),
    'Failed to execute hooks',
  );

  await executeSafely(
    () => getAmplifyLogger().logError({
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
  const {
    message, details, resolution, link, stack,
  } = amplifyException;

  printer.error(message);
  if (details) {
    printer.info(details);
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

const unknownErrorToAmplifyException = (err: unknown): AmplifyException => new AmplifyFault(
  unknownErrorTypeToAmplifyExceptionType(err), {
    message: (typeof err === 'object' && err !== null && 'message' in err) ? (err as $TSAny).message : 'Unknown error',
    resolution: mapUnknownErrorToResolution(err),
  },
);

const genericErrorToAmplifyException = (err: Error): AmplifyException => new AmplifyFault(
  genericErrorTypeToAmplifyExceptionType(err), {
    message: err.message,
    resolution: mapGenericErrorToResolution(err),
  }, err,
);

const nodeErrorToAmplifyException = (err: NodeJS.ErrnoException): AmplifyException => new AmplifyFault(
  nodeErrorTypeToAmplifyExceptionType(err), {
    message: err.message,
    resolution: mapNodeErrorToResolution(err),
    code: err.code,
  }, err,
);

const nodeErrorTypeToAmplifyExceptionType = (__err: NodeJS.ErrnoException): AmplifyFaultType => 'UnknownNodeJSFault';
const mapNodeErrorToResolution = (err: NodeJS.ErrnoException): string => {
  if (!isWindowsPlatform && err.code === 'EACCES' && err.message.includes('/.amplify/')) {
    return `Try running 'sudo chown -R $(whoami):$(id -gn) ~/.amplify' to fix this`;
  }
  return `Please report this issue at https://github.com/aws-amplify/amplify-cli/issues and include the project identifier from: 'amplify diagnose --send-report'`;
};

const genericErrorTypeToAmplifyExceptionType = (__err: Error): AmplifyFaultType => 'UnknownFault';
const mapGenericErrorToResolution = (__err: Error): string => `Please report this issue at https://github.com/aws-amplify/amplify-cli/issues and include the project identifier from: 'amplify diagnose --send-report'`;

const unknownErrorTypeToAmplifyExceptionType = (__err: unknown): AmplifyFaultType => 'UnknownFault';
const mapUnknownErrorToResolution = (__err: unknown): string => `Please report this issue at https://github.com/aws-amplify/amplify-cli/issues and include the project identifier from: 'amplify diagnose --send-report'`;

const isNodeJsError = (err: Error): err is NodeJS.ErrnoException => (err as $TSAny).code !== undefined;
