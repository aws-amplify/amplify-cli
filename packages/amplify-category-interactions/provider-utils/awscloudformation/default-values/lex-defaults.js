const uuid = require('uuid');

const getAllDefaults = (project) => {
  const name = project.projectConfig.projectName.toLowerCase().replace('-', '_');
  const [shortId] = uuid().split('-');
  const botName = `${name}_bot`;
  const region = project.amplifyMeta.providers.awscloudformation.Region;
  const authRoleName = project.amplifyMeta.providers.awscloudformation.AuthRoleName;
  const unauthRoleName = project.amplifyMeta.providers.awscloudformation.UnauthRoleName;
  const authRoleArn = project.amplifyMeta.providers.awscloudformation.AuthRoleArn;
  const unauthRoleArn = project.amplifyMeta.providers.awscloudformation.UnauthRoleArn;
  const accountNumber = authRoleArn.split(':')[4];

  const defaults = {
    botName,
    region,
    authRoleName,
    unauthRoleName,
    authRoleArn,
    unauthRoleArn,
    shortId,
    botArn: `arn:aws:lex:${region}:${accountNumber}:bot:${botName}:*`,
    resourceName: `lex${shortId}`,
    sessionTimeout: 5,
    lexPolicyName: `lexPolicy${shortId}`,
    lambdaPolicyName: `lambdaPolicy${shortId}`,
    authPolicyName: `lex_amplify_${shortId}`,
    unauthPolicyName: `lex_amplify_${shortId}`,
    roleName: `lexLambdaRole${shortId}`,
    functionName: `${name}_cfnlambda_${shortId}`,
    cloudWatchPolicyName: `cloudWatchPolicy${shortId}`,
  };
  return defaults;
};

module.exports = {
  getAllDefaults,
};
