"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageAssetPaths = exports.functionRuntimeContributorFactory = void 0;
const build_1 = require("./utils/build");
const package_1 = require("./utils/package");
const detect_1 = require("./utils/detect");
const invoke_1 = require("./utils/invoke");
const path_1 = __importDefault(require("path"));
const constants_1 = require("./utils/constants");
const functionRuntimeContributorFactory = (context) => {
    return {
        contribute: (request) => {
            const selection = request.selection;
            if (selection !== 'java') {
                return Promise.reject(new Error(`Unknown selection ${selection}`));
            }
            return Promise.resolve({
                runtime: {
                    name: 'Java',
                    value: 'java',
                    cloudTemplateValue: 'java11',
                    defaultHandler: 'example.LambdaRequestHandler::handleRequest',
                    layerExecutablePath: path_1.default.join('java', 'lib'),
                },
            });
        },
        checkDependencies: async () => {
            const result = {
                hasRequiredDependencies: true,
            };
            const resultJava = await (0, detect_1.checkJava)();
            const resultCompileJava = await (0, detect_1.checkJavaCompiler)();
            const resultGradle = await (0, detect_1.checkGradle)();
            const errArray = [];
            if (resultJava.errorMessage !== undefined) {
                errArray.push(resultJava.errorMessage);
            }
            if (resultCompileJava.errorMessage !== undefined) {
                errArray.push(resultCompileJava.errorMessage);
            }
            if (resultGradle.errorMessage !== undefined) {
                errArray.push(resultGradle.errorMessage);
            }
            result.hasRequiredDependencies =
                resultJava.hasRequiredDependencies && resultCompileJava.hasRequiredDependencies && resultGradle.hasRequiredDependencies;
            if (result.hasRequiredDependencies === false) {
                result.errorMessage = errArray.join('\n');
            }
            return result;
        },
        package: (params) => (0, package_1.packageResource)(params, context),
        build: build_1.buildResource,
        invoke: (params) => (0, invoke_1.invokeResource)(params, context),
    };
};
exports.functionRuntimeContributorFactory = functionRuntimeContributorFactory;
const getPackageAssetPaths = async () => [constants_1.relativeShimSrcPath];
exports.getPackageAssetPaths = getPackageAssetPaths;
//# sourceMappingURL=index.js.map