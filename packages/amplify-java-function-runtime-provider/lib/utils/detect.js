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
exports.checkJavaCompiler = exports.checkGradle = exports.checkJava = void 0;
const which = __importStar(require("which"));
const execa = __importStar(require("execa"));
const semver = __importStar(require("semver"));
const constants_1 = require("./constants");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const checkJava = async () => {
    const executablePath = which.sync('java', {
        nothrow: true,
    });
    if (executablePath === null) {
        return {
            hasRequiredDependencies: false,
            errorMessage: `Unable to find Java version ${constants_1.minJavaVersion} on the path. Download link: https://amzn.to/2UUljp9`,
        };
    }
    let result;
    try {
        result = execa.sync('java', ['-version']);
        if (result.exitCode !== 0) {
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `java failed, exit code was ${result.exitCode}` });
        }
    }
    catch (err) {
        throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `java failed, error message was ${err.message}` }, err);
    }
    const regex = /(\d+\.)(\d+\.)(\d)/g;
    const versionString = result.stderr ? result.stderr.split(/\r?\n/)[0] : '';
    const version = versionString.match(regex);
    if (version !== null && semver.satisfies(version[0], constants_1.minJavaVersion)) {
        return {
            hasRequiredDependencies: true,
        };
    }
    return {
        hasRequiredDependencies: false,
        errorMessage: `Update JDK to ${constants_1.minJavaVersion}. Download link: https://amzn.to/2UUljp9`,
    };
};
exports.checkJava = checkJava;
const checkGradle = async () => {
    const executablePath = which.sync('gradle', {
        nothrow: true,
    });
    if (executablePath === null) {
        return {
            hasRequiredDependencies: false,
            errorMessage: `Unable to find Gradle version ${constants_1.minGradleVersion} on the path. Download link: https://bit.ly/3aGYDj6`,
        };
    }
    let result;
    try {
        result = execa.sync('gradle', ['-v']);
        if (result.exitCode !== 0) {
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `gradle failed, exit code was ${result.exitCode}` });
        }
    }
    catch (err) {
        throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `gradle failed, error message was ${err.message}` }, err);
    }
    const regex = /(\d+\.)(\d+)/g;
    const versionLines = result.stdout ? result.stdout.split(/\r?\n/) : [];
    const versionString = versionLines.length >= 3 ? versionLines[2] : '';
    const version = versionString.match(regex);
    if (version !== null && semver.satisfies(version[0] + '.0', constants_1.minGradleVersion)) {
        return {
            hasRequiredDependencies: true,
        };
    }
    return {
        hasRequiredDependencies: false,
        errorMessage: `Update Gradle to ${constants_1.minGradleVersion}. Download link: https://bit.ly/3aGYDj6`,
    };
};
exports.checkGradle = checkGradle;
const checkJavaCompiler = async () => {
    const executablePath = which.sync('javac', {
        nothrow: true,
    });
    if (executablePath === null) {
        return {
            hasRequiredDependencies: false,
            errorMessage: `Unable to find Java compiler version ${constants_1.minJavaVersion} on the path. Download link: https://amzn.to/2UUljp9`,
        };
    }
    let result;
    try {
        result = execa.sync('javac', ['-version']);
        if (result.exitCode !== 0) {
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `java failed, exit code was ${result.exitCode}` });
        }
    }
    catch (err) {
        throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `java failed, error message was ${err.message}` }, err);
    }
    const regex = /(\d+\.)(\d+\.)(\d)/g;
    const versionString = result.stdout ? result.stdout.split(/\r?\n/)[0] : '';
    const version = versionString.match(regex);
    if (version !== null && semver.satisfies(version[0], constants_1.minJavaVersion)) {
        return {
            hasRequiredDependencies: true,
        };
    }
    return {
        hasRequiredDependencies: false,
        errorMessage: `Update JDK to ${constants_1.minJavaVersion}. Download link: https://amzn.to/2UUljp9`,
    };
};
exports.checkJavaCompiler = checkJavaCompiler;
//# sourceMappingURL=detect.js.map