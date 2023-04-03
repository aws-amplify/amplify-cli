"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalAuditLogFile = exports.getLocalLogFilePath = exports.getLogAuditFilePath = exports.getLogFilePath = void 0;
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const baseLogFilePath_1 = require("./baseLogFilePath");
function getLogFilePath() {
    return path_1.default.join((0, baseLogFilePath_1.getLogDirectory)(), constants_1.constants.LOG_FILENAME);
}
exports.getLogFilePath = getLogFilePath;
function getLogAuditFilePath() {
    return path_1.default.join((0, baseLogFilePath_1.getLogDirectory)(), constants_1.constants.LOG_AUDIT_FOLDER, constants_1.constants.LOG_AUDIT_FILENAME);
}
exports.getLogAuditFilePath = getLogAuditFilePath;
function getLocalLogFilePath(projectPath) {
    return path_1.default.join((0, baseLogFilePath_1.getLocalLogFileDirectory)(projectPath), constants_1.constants.LOG_FILENAME);
}
exports.getLocalLogFilePath = getLocalLogFilePath;
function getLocalAuditLogFile(filePath) {
    return path_1.default.join((0, baseLogFilePath_1.getLocalLogFileDirectory)(filePath), constants_1.constants.LOG_AUDIT_FOLDER, constants_1.constants.LOG_AUDIT_FILENAME);
}
exports.getLocalAuditLogFile = getLocalAuditLogFile;
//# sourceMappingURL=getLogFilePath.js.map