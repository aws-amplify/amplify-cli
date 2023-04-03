"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionTemplateContributorFactory = void 0;
const helloWorldProvider_1 = require("./providers/helloWorldProvider");
const crudProvider_1 = require("./providers/crudProvider");
const serverlessProvider_1 = require("./providers/serverlessProvider");
const triggerProvider_1 = require("./providers/triggerProvider");
const lambdaAuthProvider_1 = require("./providers/lambdaAuthProvider");
const graphqlRequestProvider_1 = require("./providers/graphqlRequestProvider");
const functionTemplateContributorFactory = (context) => {
    return {
        contribute: (request) => {
            switch (request.selection) {
                case 'hello-world': {
                    return (0, helloWorldProvider_1.provideHelloWorld)();
                }
                case 'crud': {
                    return (0, crudProvider_1.provideCrud)(context);
                }
                case 'serverless': {
                    return (0, serverlessProvider_1.provideServerless)();
                }
                case 'trigger': {
                    return (0, triggerProvider_1.provideTrigger)(context);
                }
                case 'lambda-auth': {
                    return (0, lambdaAuthProvider_1.provideLambdaAuth)();
                }
                case 'appsync-request': {
                    return (0, graphqlRequestProvider_1.graphqlRequest)(context);
                }
                default: {
                    throw new Error(`Unknown template selection [${request.selection}]`);
                }
            }
        },
    };
};
exports.functionTemplateContributorFactory = functionTemplateContributorFactory;
//# sourceMappingURL=index.js.map