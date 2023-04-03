"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperationType = void 0;
const graphql_1 = require("graphql");
const getOperationType = (document, operationName) => {
    const operationAST = (0, graphql_1.getOperationAST)(document, operationName);
    if (operationAST) {
        return operationAST.operation;
    }
    throw new Error('Could not get operation from the document');
};
exports.getOperationType = getOperationType;
//# sourceMappingURL=helpers.js.map