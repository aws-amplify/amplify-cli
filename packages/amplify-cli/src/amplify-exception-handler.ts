import {
  $TSAny, AmplifyException, AmplifyFault, AmplifyFaultType, AMPLIFY_SUPPORT_DOCS, executeHooks, HooksMeta,
} from 'amplify-cli-core';
import { AmplifyPrinter, printer } from 'amplify-prompts';
import { logger } from 'amplify-cli-logger';
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

  if (context?.usageData) {
    context?.usageData.emitError(amplifyException);
  }

  if (context && isHeadlessCommand(context)) {
    printHeadlessAmplifyException(amplifyException);
  } else {
    printAmplifyException(amplifyException);
  }

  if (context) {
    await reportError(context, amplifyException);
  }

  await executeHooks(
    HooksMeta.getInstance(undefined, 'post', {
      message: amplifyException.message ?? 'undefined error in Amplify process',
      stack: amplifyException.stack ?? 'undefined error stack',
    }),
  );

  logger.logError({
    message: amplifyException.message,
    error: amplifyException,
  });

  process.exitCode = 1;
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
  printer.blankLine();
  if (stack) {
    printer.debug(stack);
  }
};

const printHeadlessAmplifyException = (amplifyException: AmplifyException): void => {
  const errorPrinter = new AmplifyPrinter(process.stderr);
  errorPrinter.error(JSON.stringify(amplifyException.toObject()));
};

const unknownErrorToAmplifyException = (err: unknown): AmplifyException => new AmplifyFault(unknownErrorTypeToAmplifyExceptionType(err), {
  message: 'message' in (err as $TSAny) ? (err as $TSAny).message : 'Unknown error',
  resolution: mapUnknownErrorToResolution(err),
  stack: 'stack' in (err as $TSAny) ? (err as $TSAny).stack : undefined,
});

const genericErrorToAmplifyException = (err: Error): AmplifyException => new AmplifyFault(genericErrorTypeToAmplifyExceptionType(err), {
  message: err.message,
  resolution: mapGenericErrorToResolution(err),
  stack: err.stack,
  link: AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url,
});

const nodeErrorToAmplifyException = (err: NodeJS.ErrnoException): AmplifyException => new AmplifyFault(
  nodeErrorTypeToAmplifyExceptionType(err), {
    message: err.message,
    resolution: mapNodeErrorToResolution(err),
    stack: err.stack,
  },
);

const nodeErrorTypeToAmplifyExceptionType = (__err: NodeJS.ErrnoException): AmplifyFaultType => 'UnknownNodeJSFault';
const mapNodeErrorToResolution = (__err: NodeJS.ErrnoException): string => `Please report this issue at https://github.com/aws-amplify/amplify-cli/issues and include the project identifier from: 'amplify diagnose --send-report'`;

const genericErrorTypeToAmplifyExceptionType = (__err: Error): AmplifyFaultType => 'UnknownFault';
const mapGenericErrorToResolution = (__err: Error): string => `Please report this issue at https://github.com/aws-amplify/amplify-cli/issues and include the project identifier from: 'amplify diagnose --send-report'`;

const unknownErrorTypeToAmplifyExceptionType = (__err: unknown): AmplifyFaultType => 'UnknownFault';
const mapUnknownErrorToResolution = (__err: unknown): string => `Please report this issue at https://github.com/aws-amplify/amplify-cli/issues and include the project identifier from: 'amplify diagnose --send-report'`;

const isNodeJsError = (err: Error): err is NodeJS.ErrnoException => (err as $TSAny).code !== undefined;
