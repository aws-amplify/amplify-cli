async function prePushAuthTransform(context, resources) {
  resources = resources.filter(resource => resource.resourceName === 'userPoolGroups');
  // There can only be one auth resource
  if (resources.length > 0) {
    return await context.amplify.invokePluginMethod(context, 'auth', undefined, 'prePushAuthHook', [context]);
  }
  return undefined;
}

module.exports = {
  prePushAuthTransform,
};
