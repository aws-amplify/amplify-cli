"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionTemplateContributorFactory = void 0;
const helloWorldProvider_1 = require("./providers/helloWorldProvider");
const functionTemplateContributorFactory = () => {
    return {
        contribute: (request) => {
            const selection = request.selection;
            switch (selection) {
                case 'hello-world': {
                    return (0, helloWorldProvider_1.provideHelloWorld)();
                }
                default: {
                    throw new Error(`Unknown template selection [${selection}]`);
                }
            }
        },
    };
};
exports.functionTemplateContributorFactory = functionTemplateContributorFactory;
//# sourceMappingURL=index.js.map