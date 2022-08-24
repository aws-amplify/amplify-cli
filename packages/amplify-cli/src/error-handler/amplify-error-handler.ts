import { $TSAny, AmplifyError, AmplifyErrorType } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { Context } from '../domain/context';
import { reportError } from '../commands/diagnose';
import { isHeadlessCommand } from '../context-manager';

let context: Context;

/**
 * Inject a reference to the context object into this module
 */
export const init = (_context: Context): void => {
  context = _context;
};

/**
 * Handle fatal errors
 */
export const handleError = async (err: unknown): Promise<void> => {
  let amplifyError: AmplifyError;

  if (err instanceof AmplifyError) {
    amplifyError = err;
  } else if (!(err instanceof Error)) {
    amplifyError = unknownErrorToAmplifyError(err);
  } else if (isNodeJsError(err)) {
    amplifyError = nodeErrorToAmplifyError(err);
  } else {
    amplifyError = genericErrorToAmplifyError(err);
  }

  if (context?.usageData) {
    context?.usageData.emitError(amplifyError);
  }

  if (context && isHeadlessCommand(context)) {
    printHeadlessAmplifyError(amplifyError);
  } else {
    printAmplifyError(amplifyError);
  }

  if (context) {
    await reportError(context, amplifyError);
  }
};

const printAmplifyError = (amplifyError: AmplifyError): void => {
  const {
    message, details, resolution, link, stack,
  } = amplifyError;

  printer.error(message);
  if (details) {
    printer.info(details);
  }
  printer.blankLine();
  printer.info(`Resolution: ${resolution}`);
  if (link) {
    printer.info(`Learn more at: ${link}`);
  }
  printer.blankLine();
  if (stack) {
    printer.debug(stack);
  }
  process.exitCode = 1;
};

const printHeadlessAmplifyError = (amplifyError: AmplifyError): void => {
  printer.error(amplifyError.toJson());
  process.exitCode = 1;
};

const unknownErrorToAmplifyError = (err: unknown): AmplifyError => new AmplifyError(unknownErrorTypeToAmplifyErrorType(err), {
  message: 'message' in (err as $TSAny) ? (err as $TSAny).message : 'Unknown error',
  resolution: mapUnknownErrorToResolution(err),
  stack: 'stack' in (err as $TSAny) ? (err as $TSAny).stack : undefined,
});

const genericErrorToAmplifyError = (err: Error): AmplifyError => new AmplifyError(genericErrorTypeToAmplifyErrorType(err), {
  message: err.message,
  resolution: mapGenericErrorToResolution(err),
  stack: err.stack,
  link: 'https://docs.amplify.aws/cli/project/troubleshooting/',
});

const nodeErrorToAmplifyError = (err: NodeJS.ErrnoException): AmplifyError => new AmplifyError(nodeErrorTypeToAmplifyErrorType(err), {
  message: err.message,
  resolution: mapNodeErrorToResolution(err),
  stack: err.stack,
});

const nodeErrorTypeToAmplifyErrorType = (__err: NodeJS.ErrnoException): AmplifyErrorType => 'UnknownNodeJSError';
const mapNodeErrorToResolution = (__err: NodeJS.ErrnoException): string => 'Please report this issue at https://github.com/aws-amplify/amplify-cli/issues';

const genericErrorTypeToAmplifyErrorType = (__err: Error): AmplifyErrorType => 'UnknownErrorType';
const mapGenericErrorToResolution = (__err: Error): string => 'Please report this issue at https://github.com/aws-amplify/amplify-cli/issues';

const unknownErrorTypeToAmplifyErrorType = (__err: unknown): AmplifyErrorType => 'UnknownErrorType';
const mapUnknownErrorToResolution = (__err: unknown): string => 'Please report this issue at https://github.com/aws-amplify/amplify-cli/issues';

const isNodeJsError = (err: Error): err is NodeJS.ErrnoException => (err as $TSAny).code !== undefined;
