function getFrontendHandler(context) {
  const { amplify } = context;
  const projectConfig = amplify.getProjectConfig();
  return projectConfig.frontendHandler;
}

module.exports = getFrontendHandler;
