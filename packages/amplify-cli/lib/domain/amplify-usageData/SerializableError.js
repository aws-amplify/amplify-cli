"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializableError = void 0;
const path = __importStar(require("path"));
const stackTraceRegex = /^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;
const ARNRegex = /arn:[a-z0-9][-.a-z0-9]{0,62}:[A-Za-z0-9][A-Za-z0-9_/.-]{0,62}:[A-Za-z0-9_/.-]{0,63}:[A-Za-z0-9_/.-]{0,63}:[A-Za-z0-9][A-Za-z0-9:_/+=,@.-]{0,1023}/g;
class SerializableError {
    constructor(error) {
        var _a, _b;
        this.name = error.name;
        this.message = removeARN(error.message);
        this.details = removeARN((_a = error) === null || _a === void 0 ? void 0 : _a.details);
        this.code = (_b = error) === null || _b === void 0 ? void 0 : _b.code;
        this.trace = extractStackTrace(error);
    }
}
exports.SerializableError = SerializableError;
const extractStackTrace = (error) => {
    const result = [];
    if (error.stack) {
        const stack = error.stack.split('\n');
        stack.forEach((line) => {
            const match = stackTraceRegex.exec(line);
            if (match) {
                const [, methodName, file, lineNumber, columnNumber] = match;
                result.push({
                    methodName,
                    file,
                    lineNumber,
                    columnNumber,
                });
            }
        });
        const processedPaths = processPaths(result.map((trace) => trace.file));
        result.forEach((trace, index) => {
            trace.file = processedPaths[index];
        });
    }
    return result;
};
const processPaths = (paths) => {
    const result = [...paths];
    if (paths.length === 0) {
        return result;
    }
    const longestString = paths.reduce((a, b) => (a.length > b.length ? a : b));
    const directoriesToRemove = longestString.split('/');
    const directoriesRemoved = new Set();
    directoriesToRemove.forEach((directory) => {
        if (directory === '') {
            return;
        }
        for (let i = 0; i < result.length; i++) {
            if (result[i].startsWith(`/${directory}`) && result[i] !== longestString) {
                result[i] = result[i].replace(`/${directory}`, '');
                directoriesRemoved.add(directory);
            }
        }
    });
    return result.map((r) => {
        if (r === longestString) {
            return longestString.replace(path.join(...directoriesRemoved), '');
        }
        return r;
    });
};
const removeARN = (str) => {
    return str === null || str === void 0 ? void 0 : str.replace(ARNRegex, '<escaped ARN>');
};
//# sourceMappingURL=SerializableError.js.map