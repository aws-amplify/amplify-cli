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
export declare class Recorder {
    private cmd;
    private args;
    private options;
    private cols;
    private rows;
    private isPaused;
    private childProcess;
    private onDataHandlers;
    private onExitHandlers;
    private startTime;
    private recording;
    private cwd;
    private exitCode;
    constructor(cmd: string, args: string[], options: any, cwd?: string, cols?: number, rows?: number);
    run(): void;
    write(data: string): void;
    addOnDataHandler(fn: (content: string) => void): void;
    addOnExitHandlers(fn: (code: number, signal: string | number) => void): void;
    removeOnExitHandlers(fn: (code: number, signal: string | number) => void): boolean;
    getRecording(): string;
    getRecordingFrames(): Readonly<RecordingFrame[]>;
    pauseRecording(): void;
    kill(): void;
    sendEof(): void;
    resumeRecording(): void;
    private onData;
    private onExit;
    private addFrame;
    private renderPrompt;
}
