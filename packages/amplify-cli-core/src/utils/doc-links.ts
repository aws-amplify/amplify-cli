

export function getGraphQLTransformerFunctionDocLink(version: number) : string {
    switch(version){
        case 1:
            return 'https://docs.amplify.aws/cli-legacy/graphql-transformer/function';
        case 2:
            return 'https://docs.amplify.aws/cli/graphql/custom-business-logic/#lambda-function-resolver';
        default:
            return '';
    }
}


export function getGraphQLTransformerAuthDocLink(version: number): string {
    switch(version){
        case 1:
            return 'https://docs.amplify.aws/cli-legacy/graphql-transformer/auth';
        case 2:
            return 'https://docs.amplify.aws/cli/graphql/authorization-rules';
        default:
            return '';
    }
}

export function getGraphQLTransformerAuthSubscriptionsDocLink(version: number): string {
    switch(version){
        case 1:
            return `${getGraphQLTransformerAuthDocLink(version)}#authorizing-subscriptions`;
        case 2:
            return 'https://docs.amplify.aws/cli/graphql/authorization-rules';
        default:
            return '';
    }
}

export function getGraphQLTransformerOpenSearchDocLink(version: number): string {
    switch(version){
        case 1:
            return 'https://docs.amplify.aws/cli-legacy/graphql-transformer/searchable/';
        case 2:
            return 'https://docs.amplify.aws/cli/graphql/search-and-result-aggregations/';
        default:
            return '';
    }
}

export function getGraphQLTransformerOpenSearchProductionDocLink(version: number): string {
    switch(version) {
        case 1:
            return getGraphQLTransformerOpenSearchDocLink(version);
        case 2:
            return `${getGraphQLTransformerOpenSearchDocLink(version)}#set-up-opensearch-for-production-environments`
        default:
            return '';
    }
}