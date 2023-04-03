"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGraphQLTransformerOpenSearchProductionDocLink = exports.getGraphQLTransformerOpenSearchDocLink = exports.getGraphQLTransformerAuthSubscriptionsDocLink = exports.getGraphQLTransformerAuthDocLink = exports.getGraphQLTransformerFunctionDocLink = void 0;
function getGraphQLTransformerFunctionDocLink(version) {
    switch (version) {
        case 1:
            return 'https://docs.amplify.aws/cli-legacy/graphql-transformer/function';
        case 2:
            return 'https://docs.amplify.aws/cli/graphql/custom-business-logic/#lambda-function-resolver';
        default:
            return '';
    }
}
exports.getGraphQLTransformerFunctionDocLink = getGraphQLTransformerFunctionDocLink;
function getGraphQLTransformerAuthDocLink(version) {
    switch (version) {
        case 1:
            return 'https://docs.amplify.aws/cli-legacy/graphql-transformer/auth';
        case 2:
            return 'https://docs.amplify.aws/cli/graphql/authorization-rules';
        default:
            return '';
    }
}
exports.getGraphQLTransformerAuthDocLink = getGraphQLTransformerAuthDocLink;
function getGraphQLTransformerAuthSubscriptionsDocLink(version) {
    switch (version) {
        case 1:
            return `${getGraphQLTransformerAuthDocLink(version)}#authorizing-subscriptions`;
        case 2:
            return 'https://docs.amplify.aws/cli/graphql/authorization-rules';
        default:
            return '';
    }
}
exports.getGraphQLTransformerAuthSubscriptionsDocLink = getGraphQLTransformerAuthSubscriptionsDocLink;
function getGraphQLTransformerOpenSearchDocLink(version) {
    switch (version) {
        case 1:
            return 'https://docs.amplify.aws/cli-legacy/graphql-transformer/searchable/';
        case 2:
            return 'https://docs.amplify.aws/cli/graphql/search-and-result-aggregations/';
        default:
            return '';
    }
}
exports.getGraphQLTransformerOpenSearchDocLink = getGraphQLTransformerOpenSearchDocLink;
function getGraphQLTransformerOpenSearchProductionDocLink(version) {
    switch (version) {
        case 1:
            return getGraphQLTransformerOpenSearchDocLink(version);
        case 2:
            return `${getGraphQLTransformerOpenSearchDocLink(version)}#set-up-opensearch-for-production-environments`;
        default:
            return '';
    }
}
exports.getGraphQLTransformerOpenSearchProductionDocLink = getGraphQLTransformerOpenSearchProductionDocLink;
//# sourceMappingURL=doc-links.js.map