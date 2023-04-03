"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionTemplateContributorFactory = void 0;
const helloWorldProvider_1 = require("./providers/helloWorldProvider");
const serverlessProvider_1 = require("./providers/serverlessProvider");
const triggerProvider_1 = require("./providers/triggerProvider");
const crudProvider_1 = require("./providers/crudProvider");
const functionTemplateContributorFactory = (context) => {
    return {
        contribute: (request) => {
            switch (request.selection) {
                case 'hello-world': {
                    return (0, helloWorldProvider_1.provideHelloWorld)(request);
                }
                case 'serverless': {
                    return (0, serverlessProvider_1.provideServerless)(request);
                }
                case 'trigger': {
                    return (0, triggerProvider_1.provideTrigger)(request, context);
                }
                case 'crud': {
                    return (0, crudProvider_1.provideCrud)(request, context);
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