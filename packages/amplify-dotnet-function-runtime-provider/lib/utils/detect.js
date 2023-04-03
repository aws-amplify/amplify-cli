"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectDotNet = void 0;
const execa_1 = __importDefault(require("execa"));
const which_1 = __importDefault(require("which"));
const constants_1 = require("../constants");
const detectDotNet = async (runtime) => {
    const executablePath = which_1.default.sync(constants_1.executableName, {
        nothrow: true,
    });
    if (executablePath === null) {
        return {
            hasRequiredDependencies: false,
            errorMessage: `Unable to find ${constants_1.executableName} version ${constants_1.currentSupportedVersion} on the path.`,
        };
    }
    const sdkResult = execa_1.default.sync(constants_1.executableName, ['--list-sdks']);
    const installedSdks = sdkResult.stdout;
    if (sdkResult.exitCode !== 0) {
        throw new Error(`${constants_1.executableName} failed SDK detection, exit code was ${sdkResult.exitCode}`);
    }
    const requiredSdkRegex = runtime === constants_1.dotnetcore31 ? /^3\.1/m : /^6\.0/m;
    const sdkInstalled = installedSdks && installedSdks.match(requiredSdkRegex);
    const toolResult = execa_1.default.sync(constants_1.executableName, ['tool', 'list', '--global']);
    const installedToolList = toolResult.stdout;
    if (toolResult.exitCode !== 0) {
        throw new Error(`${constants_1.executableName} failed tool detection, exit code was ${toolResult.exitCode}`);
    }
    let toolInstalled = false;
    let testToolInstalled = false;
    if (installedToolList) {
        if (installedToolList.match(/^amazon\.lambda\.tools/m)) {
            toolInstalled = true;
        }
        const requiredTestToolVersionRegex = runtime === constants_1.dotnetcore31 ? /^amazon\.lambda\.testtool-3\.1/m : /^amazon\.lambda\.testtool-6\.0/m;
        if (installedToolList.match(requiredTestToolVersionRegex)) {
            testToolInstalled = true;
        }
    }
    if (sdkInstalled && toolInstalled && testToolInstalled) {
        return {
            hasRequiredDependencies: true,
        };
    }
    else {
        const result = {
            hasRequiredDependencies: false,
            errorMessage: 'Unable to detect required dependencies:\n',
        };
        if (!sdkInstalled) {
            result.errorMessage += '- The .NET 6 SDK must be installed. It can be installed from https://dotnet.microsoft.com/download\n';
        }
        if (!toolInstalled) {
            result.errorMessage +=
                '- The Amazon.Lambda.Tools global tool must be installed. Please install by running "dotnet tool install -g Amazon.Lambda.Tools".\n';
        }
        if (!testToolInstalled) {
            if (runtime === constants_1.dotnetcore31) {
                result.errorMessage +=
                    '- The Amazon.Lambda.TestTool-3.1 global tool must be installed. Please install by running "dotnet tool install -g Amazon.Lambda.TestTool-3.1".\n';
            }
            else {
                result.errorMessage +=
                    '- The Amazon.Lambda.TestTool-6.0 global tool must be installed. Please install by running "dotnet tool install -g Amazon.Lambda.TestTool-6.0".\n';
            }
        }
        return result;
    }
};
exports.detectDotNet = detectDotNet;
//# sourceMappingURL=detect.js.map