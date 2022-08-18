import os from 'os';
import chalk from 'chalk';

/**
 * String obj passed to terminal
 */
export type StringObj = {
  renderString: string,
  color: string
}

const ESC = '\u001b';
const BUFFER_LENGTH = 10;

const cursorUp = (n : number) : string => {
  const dy = typeof n === 'number' ? n : 1;
  return dy > 0 ? `${ESC}[${dy}A` : '';
};

const clearLine = () : string => `${ESC}[K`;
const SHOW_CURSOR = '\x1b[?25h';
const HIDE_CURSOR = '\x1b[?25l';

const getColoredLine = (line: string, color: string) : string => {
  if (color) {
    return chalk.keyword(color)(line);
  }
  return line;
};

/**
 * Amplify Terminal instance (Re writable block)
 */
export class AmplifyTerminal {
    private lastHeight : number;
    private trailingEmptyLines : number;
    private readonly stream: NodeJS.WriteStream;

    constructor() {
      this.lastHeight = 0;
      this.trailingEmptyLines = 0;
      this.stream = process.stdout;
    }

    /**
     * Checks if the environment is tty
     */
    isTTY(): boolean {
      return this.stream.isTTY;
    }

    /**
     * Width of terminal
     */
    private get width() : number {
      return this.stream.columns;
    }

    /**
     * Height of last printed block
     */
    public getLastHeight() : number {
      return this.lastHeight;
    }

    /**
     * Height of terminal
     */
    private get height() : number {
      return this.stream.rows;
    }

    /**
     * Write array of lines into block.
     */
    public writeLines(lines : StringObj[]) : void {
      // Go back to beginning of last written block
      this.stream.write(cursorUp(this.lastHeight));

      lines.forEach(line => {
        // Truncating to width-2 of terminal
        const { renderString, color } = line;
        let truncatedLine = renderString.substring(0, Math.min(renderString.length, this.width - BUFFER_LENGTH));
        if (truncatedLine.length) {
          truncatedLine = getColoredLine(truncatedLine, color);
        }
        this.stream.write(`${clearLine()}${truncatedLine}${os.EOL}`);
      });

      this.trailingEmptyLines = Math.max(0, this.lastHeight - lines.length);

      // Clear trailing lines if last written block has more height.
      for (let i = 0; i < this.trailingEmptyLines; i++) {
        this.stream.write(`${clearLine()}${os.EOL}`);
      }
      this.lastHeight = lines.length;
    }

    /**
     * Hide/Show cursor. Only for a tty console.
     */
    public cursor(enabled: boolean): void {
      if (!this.isTTY()) {
        return;
      }
      if (enabled) {
        this.stream.write(SHOW_CURSOR);
      } else {
        this.stream.write(HIDE_CURSOR);
      }
    }

    /**
     * Write a new line
     */
    public newLine() : void {
      this.stream.write(os.EOL);
    }
}
