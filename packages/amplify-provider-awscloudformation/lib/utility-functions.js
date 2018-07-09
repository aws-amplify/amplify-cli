const awsRegions = require('./aws-regions');
const Cognito = require('../src/aws-utils/aws-cognito');

module.exports = {
  getRegions: () => awsRegions.regions,
  staticRoles: context => ({
    unAuthRoleName: context.amplify.getProjectDetails().amplifyMeta.providers['amplify-provider-awscloudformation'].UnauthRoleName,
    authRoleName: context.amplify.getProjectDetails().amplifyMeta.providers['amplify-provider-awscloudformation'].AuthRoleName,
    unAuthRoleArn: context.amplify.getProjectDetails().amplifyMeta.providers['amplify-provider-awscloudformation'].UnauthRoleArn,
    authRoleArn: context.amplify.getProjectDetails().amplifyMeta.providers['amplify-provider-awscloudformation'].AuthRoleArn,
  }),
  getUserPools: (context, options) => new Cognito(context)
    .then(cognitoModel => cognitoModel.cognito.listUserPools({ MaxResults: 60 }).promise()
      .then((result) => {
        let userPools = result.UserPools;
        if (options && options.region) {
          userPools = userPools.filter(userPool => userPool.Id.startsWith(options.region));
        }
        return userPools;
      }))
    .catch((err) => {
      context.print.error('Failed to fetch user pools');
      throw err;
    }),

};
