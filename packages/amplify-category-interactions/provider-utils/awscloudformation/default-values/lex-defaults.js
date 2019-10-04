const uuid = require('uuid');

const getAllDefaults = project => {
  const name = project.projectConfig.projectName.toLowerCase().replace('-', '_');
  const [shortId] = uuid().split('-');
  const botName = `${name}_bot`;
  const authRoleName = {
    Ref: 'AuthRoleName',
  };

  const unauthRoleName = {
    Ref: 'UnauthRoleName',
  };

  const authRoleArn = {
    'Fn::GetAtt': ['AuthRole', 'Arn'],
  };

  const defaults = {
    botName,
    authRoleName,
    unauthRoleName,
    authRoleArn,
    shortId,
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
