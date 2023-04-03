let graphQLConfig;
const { prePushAddGraphQLCodegenHook, prePushUpdateGraphQLCodegenHook, postPushGraphQLCodegenHook } = require('amplify-codegen');
async function prePushGraphQLCodegen(context, createResources, updateResources) {
    createResources = createResources.filter((resource) => resource.service === 'AppSync');
    if (createResources.length > 0) {
        const resource = createResources[0];
        const { resourceName } = resource;
        graphQLConfig = await prePushAddGraphQLCodegenHook(context, resourceName);
        return;
    }
    if (updateResources.length > 0) {
        const resource = updateResources[0];
        const { resourceName } = resource;
        graphQLConfig = await prePushUpdateGraphQLCodegenHook(context, resourceName);
    }
}
async function postPushGraphQLCodegen(context) {
    await postPushGraphQLCodegenHook(context, graphQLConfig);
}
module.exports = {
    prePushGraphQLCodegen,
    postPushGraphQLCodegen,
};
//# sourceMappingURL=graphql-codegen.js.map