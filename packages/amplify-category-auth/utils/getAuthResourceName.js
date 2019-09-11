async function getAuthResourceName(context) {
  const { allResources } = await context.amplify.getResourceStatus();
  const authResource = allResources.filter(resource => resource.service === 'Cognito');
  let authResourceName;

  if (authResource.length > 0) {
    const resource = authResource[0];
    authResourceName = resource.resourceName;
  } else {
    throw new Error('Cognito UserPool does not exists');
  }
  return authResourceName;
}

module.exports = {
  getAuthResourceName,
};

