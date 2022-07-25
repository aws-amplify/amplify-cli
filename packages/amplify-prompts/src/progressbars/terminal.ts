import os from 'os';

const ESC = '\u001b';

const cursorUp = (n : number) : string => {
  const dy = typeof n === 'number' ? n : 1;
  return dy > 0 ? `${ESC}[${dy}A` : '';
};

const clearLine = () : string => `${ESC}[K`;
const SHOW_CURSOR = '\x1b[?25h';
const HIDE_CURSOR = '\x1b[?25l';

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
    public writeLines(lines : string[]) : void {
      // Removing /n's since we are accounting for number of lines printed.
      // This is done to retain cursor positions.
      const newLines = lines.flatMap(line => line.split(os.EOL));

      // Go back to beginning of last written block
      this.stream.write(cursorUp(this.lastHeight));

      newLines.forEach(line => {
        // Truncating to width-2 of terminal
        const truncatedLine = line.substring(0, Math.min(line.length, this.width - 2));
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
