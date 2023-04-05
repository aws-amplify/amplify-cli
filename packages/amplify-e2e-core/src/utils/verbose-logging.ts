import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';
import { Writable } from 'stream';
import { generateRandomShortId } from '.';
import strip from 'strip-ansi';

/**
 * Returns a Writable instance based on the current verbose logging config.
 * Note that if the config is set to "files" each invocation of this method will return a write stream to a new file
 * @returns
 */
export const getVerboseLogTarget = (): Writable => {
  switch (process.env.VERBOSE_LOGGING_DO_NOT_USE_IN_CI_OR_YOU_WILL_BE_FIRED) {
    case undefined:
      return new NoopWritable();
    case 'stdout':
      return new StdoutWritable();
    case 'files':
      return new FileWritable();
    default:
      throw new Error(
        `VERBOSE_LOGGING_DO_NOT_USE_IN_CI_OR_YOU_WILL_BE_FIRED must be either "stdout" or "files". Found [${process.env.VERBOSE_LOGGING_DO_NOT_USE_IN_CI_OR_YOU_WILL_BE_FIRED}]`,
      );
  }
};

class NoopWritable extends Writable {}

// Creating this wrapper so the caller can call stdoutWrapper.end without actually closing stdout
class StdoutWritable extends Writable {
  write = process.stdout.write;
}

// wrapper around a file write stream that strips out spinner logs before writing
class FileWritable extends Writable {
  private readonly writeStream: Writable;
  private readonly spinnerRegex = new RegExp(/.*(⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏).*/);

  constructor() {
    super();
    const logdir = path.join(tmpdir(), 'amplify_e2e_logs');
    fs.ensureDirSync(logdir);
    const filename = path.join(logdir, `amplify_e2e_log_${generateRandomShortId()}`);
    console.log(`CLI test logs at [${filename}]`);
    this.writeStream = fs.createWriteStream(filename);
  }
  end(...args) {
    this.writeStream.end(...args);
  }

  write(
    chunk: any,
    encodingOrCallback: BufferEncoding | ((err?: Error) => void),
    callback?: (error: Error | null | undefined) => void,
  ): boolean {
    if (typeof encodingOrCallback === 'function') {
      callback = encodingOrCallback;
    }
    if (this.spinnerRegex.test(chunk) === false && strip(chunk).trim().length > 0) {
      return this.writeStream.write(chunk, callback);
    }
    return true;
  }
}
