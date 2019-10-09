async function isAppSyncApiPendingPush(context) {
  const resourceStatus = await context.amplify.getResourceStatus('api');
  const appSyncResources = [];
  ['resourcesToBeCreated', 'resourcesToBeUpdated'].forEach(opName => {
    const status = resourceStatus[opName];
    status.forEach(resource => {
      if (resource.service === 'AppSync') {
        appSyncResources.push(resource);
      }
    });
  });

  return appSyncResources.length > 0;
}

module.exports = isAppSyncApiPendingPush;
