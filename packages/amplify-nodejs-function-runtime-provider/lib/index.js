"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionRuntimeContributorFactory = void 0;
const legacyBuild_1 = require("./utils/legacyBuild");
const legacyPackage_1 = require("./utils/legacyPackage");
const invoke_1 = require("./utils/invoke");
const path_1 = __importDefault(require("path"));
const functionRuntimeContributorFactory = (context) => {
    return {
        contribute: async (request) => {
            const selection = request.selection;
            if (selection !== 'nodejs') {
                throw new Error(`Unknown selection ${selection}`);
            }
            return {
                runtime: {
                    name: 'NodeJS',
                    value: 'nodejs',
                    cloudTemplateValue: 'nodejs16.x',
                    defaultHandler: 'index.handler',
                    layerExecutablePath: 'nodejs',
                    layerDefaultFiles: [
                        {
                            path: 'nodejs',
                            filename: 'package.json',
                            content: JSON.stringify({
                                version: '1.0.0',
                                description: '',
                                main: 'index.js',
                                dependencies: {},
                                devDependencies: {},
                            }, undefined, 2),
                        },
                    ],
                },
            };
        },
        checkDependencies: async () => ({ hasRequiredDependencies: true }),
        package: (params) => (0, legacyPackage_1.packageResource)(params, context),
        build: legacyBuild_1.buildResource,
        invoke: async (params) => (0, invoke_1.invoke)({
            packageFolder: path_1.default.join(params.srcRoot, 'src'),
            handler: params.handler,
            event: params.event,
            environment: params.envVars,
        }),
    };
};
exports.functionRuntimeContributorFactory = functionRuntimeContributorFactory;
//# sourceMappingURL=index.js.map