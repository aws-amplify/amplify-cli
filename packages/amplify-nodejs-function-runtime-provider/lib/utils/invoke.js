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
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoke = void 0;
const execa = __importStar(require("execa"));
const executorPath_1 = require("./executorPath");
const invoke = async (options) => {
    const lambdaExecution = execa.node(executorPath_1.executorPath, [], {
        env: options.environment,
        extendEnv: false,
        stdio: ['ignore', 'inherit', 'inherit', 'pipe'],
    });
    lambdaExecution.send(options);
    const childPipe = lambdaExecution.stdio[3];
    childPipe.setEncoding('utf-8');
    let data = '';
    return new Promise((resolve, reject) => {
        const closeHandler = () => {
            const { result, error } = JSON.parse(data);
            if (error) {
                reject(error);
            }
            else if (typeof result === 'undefined') {
                resolve(null);
            }
            else {
                resolve(result);
            }
        };
        childPipe.on('data', (d) => {
            data += d;
        });
        childPipe.on('close', closeHandler);
        childPipe.on('end', closeHandler);
        childPipe.on('error', reject);
    });
};
exports.invoke = invoke;
//# sourceMappingURL=invoke.js.map