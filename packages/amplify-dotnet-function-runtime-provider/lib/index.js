"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionRuntimeContributorFactory = void 0;
const constants_1 = require("./constants");
const detect_1 = require("./utils/detect");
const build_1 = require("./utils/build");
const package_1 = require("./utils/package");
const invoke_1 = require("./utils/invoke");
const functionRuntimeContributorFactory = (context) => {
    return {
        checkDependencies: detect_1.detectDotNet,
        contribute: async (contributionRequest) => {
            switch (contributionRequest.selection) {
                case constants_1.dotnet6:
                    return {
                        runtime: {
                            name: '.NET 6',
                            value: constants_1.dotnet6,
                            cloudTemplateValue: constants_1.dotnet6,
                            defaultHandler: `${contributionRequest.contributionContext.resourceName}::${contributionRequest.contributionContext.resourceName}.${contributionRequest.contributionContext.functionName}::LambdaHandler`,
                            layerExecutablePath: constants_1.dotnet6,
                        },
                    };
                default:
                    throw new Error(`Unknown selection ${contributionRequest.selection}`);
            }
        },
        package: async (request) => (0, package_1.packageAssemblies)(request, context),
        build: build_1.build,
        invoke: invoke_1.invoke,
    };
};
exports.functionRuntimeContributorFactory = functionRuntimeContributorFactory;
//# sourceMappingURL=index.js.map