import * as pty from 'node-pty-prebuilt-multiarch';
import chalk from 'chalk';

export type RecordingHeader = {
  version: 2;
  width: number;
  height: number;
  timestamp: number | null;
  title: string;
  env: any;
};
export type RecordingFrame = [number, 'o' | 'i', string];
export type Recording = {
  header: RecordingHeader;
  frames: RecordingFrame[];
};

export class Recorder {
  private isPaused: boolean = false;
  private childProcess: pty.IPty;
  private onDataHandlers: ((data: string) => void)[] = [];
  private onExitHandlers: ((exitCode: number, signal: string | number) => void)[] = [];
  private startTime: number;
  private recording: Recording;
  private cwd: string;
  private exitCode: number | undefined;
  constructor(
    private cmd: string,
    private args: string[],
    private options: any,
    cwd?: string,
    private cols: number = 120,
    private rows: number = 30,
  ) {
    this.exitCode = undefined;
    this.cwd = options.cwd || process.cwd();
    this.recording = {
      header: {
        version: 2,
        width: cols,
        height: rows,
        timestamp: null,
        title: 'Recording',
        env: options,
      },
      frames: [],
    };
  }

  run() {
    this.startTime = Date.now();
    if (this.exitCode !== undefined) {
      throw new Error('Already executed. Please start a new instance');
    }
    this.childProcess = pty.spawn(this.cmd, this.args, {
      name: 'xterm-color',
      cols: this.cols,
      rows: this.rows,
      cwd: this.cwd,
      ...this.options,
    });
    this.addFrame(this.renderPrompt(this.cwd, this.cmd, this.args));
    this.childProcess.onData(this.onData.bind(this));
    this.childProcess.onExit(this.onExit.bind(this));
  }

  write(data: string): void {
    if (this.childProcess && this.exitCode === undefined) {
      this.childProcess.write(data);
      return;
    }
    throw new Error('Can not write data. Program is either already executed or has not been run');
  }

  addOnDataHandler(fn: (content: string) => void) {
    this.onDataHandlers.push(fn);
  }

  addOnExitHandlers(fn: (code: number, signal: string | number) => void) {
    this.onExitHandlers.push(fn);
  }
  removeOnExitHandlers(fn: (code: number, signal: string | number) => void): boolean {
    const idx = this.onExitHandlers.indexOf(fn);
    if (idx === -1) {
      return false;
    }
    this.onExitHandlers.splice(idx, 1);
    return true;
  }

  getRecording(): string {
    return [JSON.stringify(this.recording.header), ...this.recording.frames.map(frame => JSON.stringify(frame))].join('\n');
  }

  pauseRecording(): void {
    this.isPaused = true;
  }

  kill() {
    this.childProcess.kill();
  }

  sendEof() {
    this.childProcess.write('\x04'); // ^D
  }

  resumeRecording(): void {
    this.isPaused = false;
  }

  private onData(data: string) {
    if (!this.isPaused) {
      this.addFrame(data);
    }
    for (let handler of this.onDataHandlers) {
      try {
        handler(data);
      } catch (e) {
        // swallow
      }
    }
  }

  private onExit(status: { exitCode: number; signal: string | number }) {
    this.exitCode = status.exitCode;
    const length = (Date.now() - this.startTime) / 1000;
    this.addFrame(this.renderPrompt(this.cwd));
    this.recording.header.timestamp = length;
    for (let handler of this.onExitHandlers) {
      try {
        handler(this.exitCode, status.signal);
      } catch (e) {
        // don't crash the recorder
      }
    }
  }

  private addFrame(data: string) {
    this.recording.frames.push([(Date.now() - this.startTime) / 1000, 'o', data]);
  }

  private renderPrompt(cwd: string, cmd?: string, args?: string[]) {
    const separator = '\u2b80';
    const basePrompt = `${chalk.bgBlack('user@host') + chalk.black(separator)}${chalk.bgBlue(cwd) + chalk.blue(separator)}`;
    const cmdPrompt = cmd ? `${cmd} ${args.length ? args.join(' ') : ''}` : '';
    return `${basePrompt} ${cmdPrompt}\r\n`;
  }
}
