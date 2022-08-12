/**
 * This class is created with the hope that one day we will move away from ora
 * and use a re writable block instead.
 */

import { AmplifyTerminal as Terminal, StringObj } from './terminal';

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
      const lines = [{
        renderString: `${this.frames[this.frameCount]} ${this.prefixText}`,
        color: '',
      }];
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
      if (text) {
        const lines : StringObj[] = [{
          renderString: text,
          color: success ? 'green' : 'red',
        }];

        clearTimeout(this.timer);
        this.terminal.writeLines(lines);
      }
    }
}
