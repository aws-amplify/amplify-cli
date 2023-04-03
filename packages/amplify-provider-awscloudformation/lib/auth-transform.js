async function prePushAuthTransform(context, resources) {
    resources = resources.filter((resource) => resource.resourceName === 'userPoolGroups');
    if (resources.length > 0) {
        return await context.amplify.invokePluginMethod(context, 'auth', undefined, 'prePushAuthHook', [context]);
    }
    return undefined;
}
module.exports = {
    prePushAuthTransform,
};
//# sourceMappingURL=auth-transform.js.map