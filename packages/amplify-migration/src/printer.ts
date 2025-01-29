import { WriteStream } from 'node:tty';
import { EOL } from 'os';

export class Printer {
  // Properties for ellipsis animation
  private timer: ReturnType<typeof setTimeout> | null = null;
  private timerSet = false;
  /**
   * Spinner frames
   */
  private spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  constructor(
    private readonly minimumLogLevel: LogLevel,
    private readonly stdout: WriteStream | NodeJS.WritableStream = process.stdout,
    private readonly stderr: WriteStream | NodeJS.WritableStream = process.stderr,
    private readonly refreshRate: number = 30,
  ) {}

  /**
   * Prints a given message to output stream followed by a newline.
   */
  print = (message: string) => {
    this.stdout.write(message);
    this.printNewLine();
  };

  /**
   * Prints a new line to output stream
   */
  printNewLine = () => {
    this.stdout.write(EOL);
  };

  /**
   * Logs a message to the output stream at the given log level followed by a newline
   */
  log(message: string, level: LogLevel = LogLevel.INFO) {
    const doLogMessage = level <= this.minimumLogLevel;

    if (!doLogMessage) {
      return;
    }

    const logMessage = this.minimumLogLevel === LogLevel.DEBUG ? `[${LogLevel[level]}] ${new Date().toISOString()}: ${message}` : message;

    if (level === LogLevel.ERROR) {
      this.stderr.write(logMessage);
    } else {
      this.stdout.write(logMessage);
    }

    this.printNewLine();
  }

  /**
   * Logs a message with animated spinner.
   * If stdout is not a TTY, the message is logged at the info level without a spinner
   */
  async indicateProgress(message: string, callback: () => Promise<void>) {
    try {
      this.startAnimatingSpinner(message);
      await callback();
    } finally {
      this.stopAnimatingSpinner();
    }
  }

  /**
   * Writes escape sequence to stdout
   */
  private writeEscapeSequence(action: EscapeSequence) {
    if (!this.isTTY()) {
      return;
    }

    this.stdout.write(action);
  }

  /**
   * Checks if the environment is TTY
   */
  private isTTY() {
    return this.stdout instanceof WriteStream && this.stdout.isTTY;
  }

  /**
   * Starts animating spinner with a message.
   */
  private startAnimatingSpinner(message: string) {
    if (this.timerSet) {
      throw new Error('Timer is already set to animate spinner, stop the current running timer before starting a new one.');
    }

    if (!this.isTTY()) {
      this.log(message, LogLevel.INFO);
      return;
    }

    let frameIndex = 0;
    this.timerSet = true;
    this.writeEscapeSequence(EscapeSequence.HIDE_CURSOR);
    this.timer = setInterval(() => {
      this.writeEscapeSequence(EscapeSequence.CLEAR_LINE);
      this.writeEscapeSequence(EscapeSequence.MOVE_CURSOR_TO_START);
      const frame = this.spinnerFrames[frameIndex];
      this.stdout.write(`${frame} ${message}`);
      frameIndex = (frameIndex + 1) % this.spinnerFrames.length;
    }, this.refreshRate);
  }

  /**
   * Stops animating spinner.
   */
  private stopAnimatingSpinner() {
    if (!this.isTTY()) {
      return;
    }
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timerSet = false;
    this.writeEscapeSequence(EscapeSequence.CLEAR_LINE);
    this.writeEscapeSequence(EscapeSequence.MOVE_CURSOR_TO_START);
    this.writeEscapeSequence(EscapeSequence.SHOW_CURSOR);
  }
}

export enum LogLevel {
  ERROR = 0,
  INFO = 1,
  DEBUG = 2,
}

enum EscapeSequence {
  CLEAR_LINE = '\x1b[2K',
  MOVE_CURSOR_TO_START = '\x1b[0G',
  SHOW_CURSOR = '\x1b[?25h',
  HIDE_CURSOR = '\x1b[?25l',
}

const minimumLogLevel = process.argv.includes('--debug') ? LogLevel.DEBUG : LogLevel.INFO;

export const printer = new Printer(minimumLogLevel);
