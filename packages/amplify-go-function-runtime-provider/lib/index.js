"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageAssetPaths = exports.functionRuntimeContributorFactory = void 0;
const runtime_1 = require("./runtime");
const localinvoke_1 = require("./localinvoke");
const constants_1 = require("./constants");
const functionRuntimeContributorFactory = (context) => {
    return {
        contribute: (request) => {
            if (request.selection !== 'go') {
                return Promise.reject(new Error(`Unknown selection ${request.selection}`));
            }
            return Promise.resolve({
                runtime: {
                    name: 'Go 1.x',
                    value: 'go1.x',
                    cloudTemplateValue: 'go1.x',
                    defaultHandler: 'main',
                    layerExecutablePath: 'go1.x',
                },
            });
        },
        checkDependencies: () => (0, runtime_1.checkDependencies)(),
        package: (request) => (0, runtime_1.packageResource)(request, context),
        build: runtime_1.buildResource,
        invoke: (request) => (0, localinvoke_1.localInvoke)(request, context),
    };
};
exports.functionRuntimeContributorFactory = functionRuntimeContributorFactory;
const getPackageAssetPaths = async () => [constants_1.relativeShimSrcPath];
exports.getPackageAssetPaths = getPackageAssetPaths;
//# sourceMappingURL=index.js.map