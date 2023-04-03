"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSubscription = void 0;
const graphql_1 = require("graphql");
const query_and_mutation_1 = require("./query-and-mutation");
const helpers_1 = require("./helpers");
async function runSubscription(schema, document, variables, operationName, context) {
    const operationType = (0, helpers_1.getOperationType)(document);
    if (operationType !== 'subscription') {
        const error = new Error(`Expected operation type subscription, received ${operationType}`);
        error.name = 'GraphQL operation error';
        throw error;
    }
    const result = await (0, query_and_mutation_1.runQueryOrMutation)(schema, document, variables, operationName, context);
    if (result.errors && result.errors.length) {
        return result;
    }
    const subscriptionResult = await (0, graphql_1.subscribe)({
        schema: schema,
        document,
        variableValues: variables,
        contextValue: context,
        operationName,
    });
    if (subscriptionResult.errors) {
        return {
            data: result.data,
            errors: subscriptionResult.errors,
        };
    }
    return { asyncIterator: subscriptionResult, ...result };
}
exports.runSubscription = runSubscription;
//# sourceMappingURL=subscriptions.js.map