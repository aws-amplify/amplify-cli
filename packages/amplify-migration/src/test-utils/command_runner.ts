import { Argv } from 'yargs';
import { AsyncLocalStorage } from 'node:async_hooks';
import { extractSubCommands } from '../extract_sub_commands.js';
import { generateCommandFailureHandler } from '../error_handler.js';

class OutputInterceptor {
  private output = '';
  append = (chunk: string) => {
    this.output += chunk;
  };
  getOutput = () => this.output;
}

const asyncLocalStorage = new AsyncLocalStorage<OutputInterceptor>();

// Casting original write to Function to disable compiler safety intentionally.
// The process.stdout.write has many overloads and it's impossible to get right types here.
// We're passing unchanged argument list to original method, therefore this is safe.
// eslint-disable-next-line @typescript-eslint/ban-types
const createInterceptedWrite = (originalWrite: Function) => {
  return (...args: never[]) => {
    const interceptor: OutputInterceptor | undefined = asyncLocalStorage.getStore();
    if (interceptor && args.length > 0 && typeof args[0] === 'string') {
      interceptor.append(args[0]);
    }

    return originalWrite(...args);
  };
};
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = createInterceptedWrite(originalStdoutWrite);

const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = createInterceptedWrite(originalStderrWrite);

/**
 * An error that has both output and error that occurred during command execution.
 */
export class TestCommandError extends Error {
  /**
   * Creates new test command error.
   */
  constructor(readonly error: Error, readonly output: string) {
    super();
  }
}

/**
 * Runs commands given preconfigured yargs parser.
 */
export class TestCommandRunner {
  /**
   * Creates new command runner.
   */
  constructor(private parser: Argv) {
    this.parser = parser
      // Pin locale
      .locale('en')
      // Override script name to avoid long test file names
      .scriptName('migrate')
      // Make sure we don't exit process on error or --help
      .exitProcess(false)
      // attach the failure handler
      // this is necessary because we may be testing a subcommand that doesn't have the top-level failure handler attached
      // eventually we may want to have a separate "testFailureHandler" if we need additional tooling here
      .fail(generateCommandFailureHandler(parser));
  }

  /**
   * Runs a command. Returns command output or throws an error if command failed.
   */
  runCommand = async (args: string | Array<string>): Promise<string> => {
    const interceptor = new OutputInterceptor();
    try {
      // We are using AsyncLocalStorage and OutputInterceptor to capture stdout and stdin streams into memory
      // instead of using parse/parseAsync with callback.
      // The reasons are:
      // - parse/parseAsync with callback leaves orphan promises that trigger unhandledRejection handler in tests
      // - parse/parseAsync with callback have edge cases if command builder and handler methods are sync or async
      //   see https://github.com/yargs/yargs/issues/1069
      //   and https://github.com/yargs/yargs/blob/main/docs/api.md#parseargs-context-parsecallback
      // - callback can only capture yargs logger outputs. it can't capture messages emitted from our code
      //
      // AsyncLocalStorage is used to make sure that we're capturing outputs only from the same asynchronous context
      // in potentially concurrent environment.
      await asyncLocalStorage.run(interceptor, async () => {
        await this.parser.parseAsync(args);
        const metricDimension: Record<string, string> = {};
        const subCommands = extractSubCommands(this.parser);

        if (subCommands) {
          metricDimension.command = subCommands;
        }
      });
      return interceptor.getOutput();
    } catch (err) {
      throw new TestCommandError(err as Error, interceptor.getOutput());
    }
  };
}
