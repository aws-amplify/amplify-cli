"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runQueryOrMutation = void 0;
const graphql_1 = require("graphql");
const expose_graphql_errors_1 = require("../expose-graphql-errors");
async function runQueryOrMutation(schema, doc, variables, operationName, context) {
    const validationErrors = (0, graphql_1.validate)(schema, doc, graphql_1.specifiedRules);
    if (validationErrors.length === 0) {
        const results = await (0, graphql_1.execute)(schema, doc, null, context, variables, operationName);
        const errors = [...(results.errors || []), ...(context.appsyncErrors || [])];
        if (errors.length > 0) {
            results.errors = (0, expose_graphql_errors_1.exposeGraphQLErrors)(errors);
        }
        return { data: null, ...results };
    }
    return { errors: validationErrors, data: null };
}
exports.runQueryOrMutation = runQueryOrMutation;
//# sourceMappingURL=query-and-mutation.js.map