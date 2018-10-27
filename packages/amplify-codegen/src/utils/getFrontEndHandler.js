function getFrontendHandler(context) {
  const { amplify } = context;
  const projectConfig = amplify.getProjectConfig();
  return projectConfig.frontend;
}

module.exports = getFrontendHandler;
