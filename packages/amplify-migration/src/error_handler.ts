import { Argv } from 'yargs';
import { extractSubCommands } from './extract_sub_commands';
import { format } from './format';
import { printer } from './printer';

type HandleErrorProps = {
  error?: Error;
  message?: string;
  command?: string;
  preambleMessage?: () => void;
  debug: boolean;
};

/**
 * Generates a function that is intended to be used as a callback to yargs.fail()
 * All logic for actually handling errors should be delegated to handleError.
 *
 * For some reason the yargs object that is injected into the fail callback does not include all methods on the Argv type
 * This generator allows us to inject the yargs parser into the callback so that we can call parser.exit() from the failure handler
 * This prevents our top-level error handler from being invoked after the yargs error handler has already been invoked
 */
export const generateCommandFailureHandler = (parser: Argv): ((message: string, error: Error, debug?: boolean) => Promise<void>) => {
  /**
   * Format error output when a command fails
   * @param message error message set by the yargs:check validations
   * @param error error thrown by yargs handler
   * @param debug whether to print the stack trace
   */
  const handleCommandFailure = async (message: string, error?: Error, debug = false) => {
    const printHelp = () => {
      printer.printNewLine();
      parser.showHelp();
      printer.printNewLine();
    };
    await handleErrorSafe({
      command: extractSubCommands(parser),
      preambleMessage: printHelp,
      error,
      message,
      debug,
    });
    parser.exit(1, error || new Error(message));
  };
  return handleCommandFailure;
};

const handleErrorSafe = async (props: HandleErrorProps) => {
  try {
    await handleError(props);
  } catch (e) {
    console.error(e);
    // no-op should gracefully exit
    return;
  }
};

const isUserForceClosePromptError = (err?: Error): boolean => {
  return !!err && err?.message.includes('User force closed the prompt');
};

const handleError = async ({ error, message, preambleMessage, debug }: HandleErrorProps) => {
  // If yargs threw an error because the customer force-closed a prompt (ie Ctrl+C during a prompt,
  // then the intent to exit the process is clear
  if (isUserForceClosePromptError(error)) {
    return;
  }

  preambleMessage?.();

  printer.print(format.error(message || String(error)));
  if (debug && error && error.stack) {
    printer.print(format.error(error.stack));
  }
};
