import { printer, AmplifySpinner, isDebug as globalIsDebug } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';

/**
 * Logger that manages a spinner in normal mode and falls back to
 * plain text output in debug mode. Consumers use info/debug/warn
 * for messages and push/pop to manage hierarchical spinner context.
 */
export class SpinningLogger {
  private static readonly SEPARATOR = ' → ';
  private static readonly instances = new Set<SpinningLogger>();
  private static sigintRegistered = false;
  private readonly segments: string[] = [];
  private readonly spinner: AmplifySpinner;
  private readonly debugMode: boolean;
  private spinnerActive = false;

  constructor(private readonly prefix: string, options?: { readonly debug?: boolean }) {
    this.debugMode = options?.debug ?? globalIsDebug;
    this.spinner = new AmplifySpinner();

    // Register the SIGINT handler only once to avoid accumulating listeners
    // across multiple SpinningLogger instances (which causes
    // MaxListenersExceededWarning and prevents clean process exit in tests).
    if (!SpinningLogger.sigintRegistered) {
      SpinningLogger.sigintRegistered = true;
      process.on('SIGINT', () => {
        for (const instance of SpinningLogger.instances) {
          if (instance.spinnerActive) {
            instance.spinner.stop();
          }
        }
        // Registering a SIGINT handler disables the default exit behavior, so we must exit explicitly.
        process.exit(130);
      });
    }
  }

  /**
   * Starts the spinner with an initial segment (no-op in debug mode).
   */
  public start(text: string): void {
    this.segments.length = 0;
    this.segments.push(text);
    if (this.debugMode) {
      this.printLine(text, '→');
      return;
    }
    this.spinnerActive = true;
    SpinningLogger.instances.add(this);
    this.spinner.start(this.buildSpinnerText());
  }

  /**
   * Stops the spinner and clears all segments.
   */
  public stop(): void {
    this.segments.length = 0;
    if (!this.debugMode && this.spinnerActive) {
      this.spinner.stop();
      this.spinnerActive = false;
      SpinningLogger.instances.delete(this);
    }
  }

  /**
   * Stops the spinner and prints the phase text as a permanent success line.
   */
  public succeed(text: string): void {
    this.segments.length = 0;
    if (this.debugMode) {
      this.printLine(text, '•');
      return;
    }
    if (this.spinnerActive) {
      this.spinner.stop(text, true);
      this.spinnerActive = false;
      SpinningLogger.instances.delete(this);
    }
  }

  /**
   * Stops the spinner and prints the phase text as a permanent failure line.
   */
  public failed(text: string): void {
    this.segments.length = 0;
    if (this.debugMode) {
      this.printLine(text, '•');
      return;
    }
    if (this.spinnerActive) {
      this.spinner.stop(text, false);
      this.spinnerActive = false;
      SpinningLogger.instances.delete(this);
    }
  }

  /**
   * Pushes a segment onto the context stack and updates the spinner.
   */
  public push(text: string): void {
    this.segments.push(text);
    if (this.debugMode) {
      this.printLine(text, '→');
      return;
    }
    if (this.spinnerActive) {
      this.spinner.resetMessage(this.buildSpinnerText());
    }
  }

  /**
   * Pops the last segment from the context stack.
   */
  public pop(): void {
    this.segments.pop();
    if (!this.debugMode && this.spinnerActive && this.segments.length > 0) {
      this.spinner.resetMessage(this.buildSpinnerText());
    }
  }

  /**
   * Logs an informational message. Pauses the spinner if active.
   */
  public info(message: string): void {
    this.withSpinnerPaused(() => this.printLine(message, '•'));
  }

  /**
   * Logs a debug message (only visible in debug mode).
   */
  public debug(message: string): void {
    if (this.debugMode) {
      printer.debug(this.formatLine(message, '·'));
    }
  }

  /**
   * Logs a warning message. Pauses the spinner if active.
   */
  public warn(message: string): void {
    if (this.debugMode) {
      printer.warn(this.formatLine(message, '·'));
      return;
    }
    this.withSpinnerPaused(() => printer.warn(this.formatLine(message, '·')));
  }

  /**
   * Temporarily pauses the spinner, runs fn, then resumes.
   */
  public withSpinnerPaused(fn: () => void): void {
    if (!this.spinnerActive || this.debugMode) {
      fn();
      return;
    }
    this.spinner.stop();
    fn();
    this.spinner.start(this.buildSpinnerText());
  }

  public pause() {
    if (this.spinnerActive && !this.debugMode) {
      this.spinnerActive = false;
      SpinningLogger.instances.delete(this);
      this.spinner.stop();
    }
  }

  public resume() {
    if (!this.spinnerActive && !this.debugMode) {
      this.spinnerActive = true;
      SpinningLogger.instances.add(this);
      this.spinner.start(this.buildSpinnerText());
    }
  }

  /**
   * Temporarily pauses the spinner, runs fn, then resumes.
   */
  public async withSpinnerPausedAsync(fn: () => Promise<void>): Promise<void> {
    if (!this.spinnerActive || this.debugMode) {
      await fn();
      return;
    }
    this.spinner.stop();
    await fn();
    this.spinner.start(this.buildSpinnerText());
  }

  private buildSpinnerText(): string {
    return this.segments.join(SpinningLogger.SEPARATOR);
  }

  private formatLine(message: string, bullet: string): string {
    return `[${new Date().toISOString()}] [${chalk.bold(this.prefix)}] ${bullet} ${message}`;
  }

  private printLine(message: string, bullet: string): void {
    printer.info(this.formatLine(message, bullet));
  }
}
