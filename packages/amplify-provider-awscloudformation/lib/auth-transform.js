const { prePushAuthHook } = require('amplify-category-auth');


async function prePushAuthTransform(context, resources) {
  resources = resources.filter(resource => resource.resourceName === 'userPoolGroups');
  // There can only be one auth resource
  if (resources.length > 0) {
    return await prePushAuthHook(context);
  }
}

module.exports = {
  prePushAuthTransform,
};
