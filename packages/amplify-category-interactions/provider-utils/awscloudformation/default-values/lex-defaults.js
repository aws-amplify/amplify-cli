const uuid = require('uuid');

const getAllDefaults = (project) => {
  const name = project.projectConfig.projectName.toLowerCase().replace('-', '_');
  const [shortId] = uuid().split('-');
  const region = project.amplifyMeta.providers.awscloudformation.Region;
  const defaults = {
    resourceName: `lex${shortId}`,
    botName: `${name}_bot`,
    sessionTimeout: 5,
    lexPolicyName: `lexPolicy${shortId}`,
    authPolicyName: `lex_amplify_${shortId}`,
    unauthPolicyName: `lex_amplify_${shortId}`,
    roleName: `lexLambdaRole${shortId}`,
    functionName: `${name}_cfnlambda_${shortId}`,
    cloudWatchPolicyName: `cloudWatchPolicy${shortId}`,
    region,
  };
  return defaults;
};

module.exports = {
  getAllDefaults,
};
