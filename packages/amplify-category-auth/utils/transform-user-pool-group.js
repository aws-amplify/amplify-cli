const path = require('path');

async function transformUserPoolGroupSchema(context) {
  const resourceDirPath = path.join(
    context.amplify.pathManager.getBackendDirPath(),
    'auth',
    'userPoolGroups',
    'user-pool-group-precedence.json',
  );


  const { allResources } = await context.amplify.getResourceStatus();
  const authResource = allResources.filter(resource => resource.service === 'Cognito');
  let authResourceName;

  if (authResource.length > 0) {
    const resource = authResource[0];
    authResourceName = resource.resourceName;
  } else {
    throw new Error('Cognito UserPool does not exists');
  }

  const groups = context.amplify.readJsonFile(resourceDirPath);

  const copyJobs = [
    {
      dir: __dirname,
      template: '../provider-utils/awscloudformation/cloudformation-templates/user-pool-group-template.json.ejs',
      target: path.join(
        context.amplify.pathManager.getBackendDirPath(),
        'auth',
        'userPoolGroups',
        'template.json',
      ),
    },
  ];


  const props = {
    groups,
    cognitoResourceName: authResourceName,
  };


  await context.amplify.copyBatch(context, copyJobs, props, true);
}


module.exports = {
  transformUserPoolGroupSchema,
};
