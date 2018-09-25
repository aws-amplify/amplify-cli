const uuid = require('uuid');

const getAllDefaults = (project) => {
  const name = project.projectConfig.projectName.toLowerCase().replace('-', '_');
  const [shortId] = uuid().split('-');
  const botName = `${name}_bot`;
  const region = project.amplifyMeta.providers.awscloudformation.Region;
  const authRoleName = project.amplifyMeta.providers.awscloudformation.AuthRoleName;
  const unauthRoleName = project.amplifyMeta.providers.awscloudformation.UnauthRoleName;
  const authRoleArn = project.amplifyMeta.providers.awscloudformation.AuthRoleArn;
  const accountNumber = authRoleArn.split(':')[4];
  const resourceArn = `arn:aws:lex:${region}:${accountNumber}:bot:${botName}:*`;

  const defaults = {
    botName,
    region,
    authRoleName,
    unauthRoleName,
    resourceArn,
    resourceName: `lex${shortId}`,
    sessionTimeout: 5,
    lexPolicyName: `lexPolicy${shortId}`,
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
