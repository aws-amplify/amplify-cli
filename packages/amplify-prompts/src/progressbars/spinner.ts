/**
 * This class is created with the hope that one day we will move away from ora
 * and use a re writable block instead.
 */

import { AmplifyTerminal, TerminalLine } from './terminal';

/**
 * Amplify spinner instance
 */
export class AmplifySpinner {
  private frameCount: number;
  private frames: string[];
  private timer!: ReturnType<typeof setTimeout>;
  private prefixText: string;
  private terminal: AmplifyTerminal | null;
  private refreshRate: number;

  constructor() {
    this.frameCount = 0;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.prefixText = '';
    this.refreshRate = 50;
    this.terminal = null;
  }

  /**
   * Render function
   */
  private render(): void {
    if (!this.terminal || !this.terminal.isTTY()) {
      return;
    }
    if (this.timer) {
      clearTimeout(this.timer);
    }
    const lines = [
      {
        renderString: `${this.frames[this.frameCount]} ${this.prefixText}`,
        color: '',
      },
    ];
    this.frameCount = ++this.frameCount % this.frames.length;
    this.terminal.writeLines(lines);
    this.timer = setTimeout(() => this.render(), this.refreshRate);
  }

  /**
   * Starts a spinner and calls render function.
   */
  start(text: string | null): void {
    if (!this.terminal) {
      this.terminal = new AmplifyTerminal();
    }
    if (!this.terminal.isTTY()) {
      return;
    }
    this.prefixText = text ? text.replace('\n', '') : this.prefixText;
    this.terminal.cursor(false);
    this.render();
  }

  /**
   * Reset spinner message
   */
  resetMessage(text: string | null): void {
    if (!this.terminal || !this.terminal.isTTY()) {
      this.start(text);
      return;
    }
    this.prefixText = text ? text.replace('\n', '') : this.prefixText;
  }

  /**
   * Stops the spinner
   */
  stop(text?: string | null, success = true): void {
    if (!this.terminal) {
      return;
    }
    if (this.terminal.isTTY()) {
      const lines: TerminalLine[] = [
        {
          renderString: text || '',
          color: success ? 'green' : 'red',
        },
      ];

      clearTimeout(this.timer);
      this.terminal.writeLines(lines);
      this.terminal.cursor(true);
    }
    this.terminal = null;
  }
}
