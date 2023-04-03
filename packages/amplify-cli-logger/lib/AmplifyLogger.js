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
exports.AmplifyLogger = void 0;
const winston_1 = __importStar(require("winston"));
const os = __importStar(require("os"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const constants_1 = require("./constants");
const getLogFilePath_1 = require("./getLogFilePath");
const { combine, timestamp, splat, printf } = winston_1.format;
class AmplifyLogger {
    constructor() {
        this.disabledAmplifyLogging = process.env.AMPLIFY_CLI_DISABLE_LOGGING === 'true';
        this.logger = winston_1.default.createLogger();
        this.loggerFormat = combine(timestamp(), splat(), printf(this.formatter));
        if (!this.disabledAmplifyLogging) {
            this.logger.add(new winston_daily_rotate_file_1.default({
                auditFile: (0, getLogFilePath_1.getLogAuditFilePath)(),
                filename: (0, getLogFilePath_1.getLogFilePath)(),
                datePattern: constants_1.constants.DATE_PATTERN,
                maxFiles: constants_1.constants.MAX_FILE_DAYS,
                handleExceptions: false,
                format: this.loggerFormat,
            }));
        }
        else {
            this.logger.add(new winston_1.default.transports.Console({
                silent: true,
            }));
        }
    }
    loggerEnd() {
        this.logger.end();
    }
    formatter(info) {
        const format = `${info.timestamp}|${info.level} : ${info.message}`;
        if (info.level === 'error') {
            return `${format}${os.EOL}${info.error}`;
        }
        return format;
    }
    projectLocalLogInit(projectPath) {
        if (!this.disabledAmplifyLogging) {
            this.logger.add(new winston_daily_rotate_file_1.default({
                auditFile: (0, getLogFilePath_1.getLocalAuditLogFile)(projectPath),
                filename: (0, getLogFilePath_1.getLocalLogFilePath)(projectPath),
                datePattern: constants_1.constants.DATE_PATTERN,
                maxFiles: constants_1.constants.MAX_FILE_DAYS,
                handleExceptions: false,
                format: this.loggerFormat,
            }));
        }
    }
    logInfo(content) {
        const { message, ...others } = content;
        this.logger.info(message, { ...others });
    }
    logError(content) {
        const { message, ...others } = content;
        this.logger.error(message, { ...others });
    }
}
exports.AmplifyLogger = AmplifyLogger;
//# sourceMappingURL=AmplifyLogger.js.map