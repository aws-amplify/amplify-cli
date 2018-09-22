function getFrontendHandler(context) {
  const { amplify } = context;
  const projectConfig = amplify.getProjectConfig();
  const frontEndHandler = Object.keys(projectConfig.frontendHandler)[0];
  return frontEndHandler;
}

module.exports = getFrontendHandler;
