const uuid = require('uuid');

const getAllDefaults = (project) => {
  const name = project.projectConfig.projectName.toLowerCase().replace("-", "_");
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `lex${shortId}`,
    botName: `${name}_bot`,
    sessionTimeout: 5,
    lexPolicyName: `pinpointPolicy${shortId}`,
    authPolicyName: `pinpoint_amplify_${shortId}`,
    unauthPolicyName: `pinpoint_amplify_${shortId}`,
  };
  return defaults;
};

module.exports = {
  getAllDefaults,
};
