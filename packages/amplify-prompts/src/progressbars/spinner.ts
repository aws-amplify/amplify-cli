/**
 * This class is created with the hope that one day we will move away from ora
 * and use a re writable block instead.
 */
import chalk from 'chalk';
import { AmplifyTerminal as Terminal } from './terminal';

/**
 * Amplify spinner instance
 */
export class AmplifySpinner {
    private frameCount : number;
    private frames : string[];
    private timer!: ReturnType<typeof setTimeout>;
    private prefixText : string;
    private terminal: Terminal;
    private refreshRate: number;

    constructor(text : string) {
      this.frameCount = 0;
      this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      this.prefixText = text;
      this.terminal = new Terminal();
      this.refreshRate = 50;
    }

    /**
     * Render function
     */
    render() : void {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      const lines = [`${chalk.blue(this.frames[this.frameCount])} ${this.prefixText}`];
      this.frameCount = ++this.frameCount % this.frames.length;
      this.terminal.writeLines(lines);
      this.timer = setTimeout(() => this.render(), this.refreshRate);
    }

    /**
     * Starts a spinner and calls render function.
     */
    start() : void {
      this.prefixText = this.prefixText.replace('\n', '');
      this.terminal.cursor(false);
      this.render();
    }

    /**
     * Stops the spinner
     */
    stop(text : string | null, success = true) : void {
      let lines : string[] = [];
      clearTimeout(this.timer);
      if (text) {
        lines = success ? [chalk.green(text)] : [chalk.red(text)];
      }
      this.terminal.writeLines(lines);
    }
}
