// TODO: Put this in package.json and integrate with lerna to bump up version

// Track Amplify Admin generated stacks
const userAgent =  !!process.env.CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_DELETION ? 'aws-amplify-admin/0.1.0' : 'aws-amplify-cli/0.1.0';

function formUserAgentParam(context, userAgentAction) {
  const { amplify } = context;
  const projectConfig = context.exeInfo ? context.exeInfo.projectConfig : amplify.getProjectConfig();

  let framework = projectConfig.frontend;

  if (framework === 'javascript') {
    ({ framework } = projectConfig.javascript);
  }

  const userAgentParam = `${userAgent} ${framework} ${userAgentAction}`;

  return userAgentParam;
}

module.exports = {
  formUserAgentParam,
};
