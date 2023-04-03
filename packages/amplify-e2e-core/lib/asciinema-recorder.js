"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recorder = void 0;
const pty = __importStar(require("node-pty"));
const chalk_1 = __importDefault(require("chalk"));
class Recorder {
    constructor(cmd, args, options, cwd, cols = 120, rows = 30) {
        this.cmd = cmd;
        this.args = args;
        this.options = options;
        this.cols = cols;
        this.rows = rows;
        this.isPaused = false;
        this.onDataHandlers = [];
        this.onExitHandlers = [];
        this.exitCode = undefined;
        this.cwd = options.cwd || process.cwd();
        this.recording = {
            header: {
                version: 2,
                width: cols,
                height: rows,
                timestamp: null,
                title: 'Recording',
                env: {},
            },
            frames: [],
        };
    }
    run() {
        this.startTime = Date.now();
        if (this.exitCode !== undefined) {
            throw new Error('Already executed. Please start a new instance');
        }
        this.childProcess = pty.spawn(this.cmd, this.args, Object.assign({ name: 'xterm-color', cols: this.cols, rows: this.rows, cwd: this.cwd, shell: true }, this.options));
        this.addFrame(this.renderPrompt(this.cwd, this.cmd, this.args));
        this.childProcess.onData(this.onData.bind(this));
        this.childProcess.onExit(this.onExit.bind(this));
    }
    write(data) {
        if (this.childProcess && this.exitCode === undefined) {
            this.childProcess.write(data);
            return;
        }
        throw new Error('Can not write data. Program is either already executed or has not been run');
    }
    addOnDataHandler(fn) {
        this.onDataHandlers.push(fn);
    }
    addOnExitHandlers(fn) {
        this.onExitHandlers.push(fn);
    }
    removeOnExitHandlers(fn) {
        const idx = this.onExitHandlers.indexOf(fn);
        if (idx === -1) {
            return false;
        }
        this.onExitHandlers.splice(idx, 1);
        return true;
    }
    getRecording() {
        return [JSON.stringify(this.recording.header), ...this.recording.frames.map((frame) => JSON.stringify(frame))].join('\n');
    }
    getRecordingFrames() {
        return [...this.recording.frames];
    }
    pauseRecording() {
        this.isPaused = true;
    }
    kill() {
        this.childProcess.kill();
    }
    sendEof() {
        this.childProcess.write('\x04'); // ^D
    }
    resumeRecording() {
        this.isPaused = false;
    }
    onData(data) {
        if (!this.isPaused) {
            this.addFrame(data);
        }
        for (const handler of this.onDataHandlers) {
            try {
                handler(data);
            }
            catch (e) {
                // swallow
            }
        }
    }
    onExit(status) {
        this.exitCode = status.exitCode;
        const length = (Date.now() - this.startTime) / 1000;
        this.addFrame(this.renderPrompt(this.cwd));
        this.recording.header.timestamp = length;
        for (const handler of this.onExitHandlers) {
            try {
                handler(this.exitCode, status.signal);
            }
            catch (e) {
                // don't crash the recorder
            }
        }
    }
    addFrame(data) {
        this.recording.frames.push([(Date.now() - this.startTime) / 1000, 'o', data]);
    }
    renderPrompt(cwd, cmd, args) {
        const separator = '\u2b80';
        const basePrompt = `${chalk_1.default.bgBlack('user@host') + chalk_1.default.black(separator)}${chalk_1.default.bgBlue(cwd) + chalk_1.default.blue(separator)}`;
        const cmdPrompt = cmd ? `${cmd} ${args.length ? args.join(' ') : ''}` : '';
        return `${basePrompt} ${cmdPrompt}\r\n`;
    }
}
exports.Recorder = Recorder;
//# sourceMappingURL=asciinema-recorder.js.map