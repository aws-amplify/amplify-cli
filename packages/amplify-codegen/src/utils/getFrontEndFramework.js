const getFrontendHandler = require('./getFrontEndHandler');

function getFrontEndFramework(context) {
  const { amplify } = context;
  let frontendHandler = context.frontend;
  if (!context.withoutInit) {
    frontendHandler = getFrontendHandler(context);
  }
  if (frontendHandler === 'javascript') {
    if (!context.withoutInit) {
      const projectConfig = amplify.getProjectConfig();
      return projectConfig.javascript.framework;
    }
    return context.framework;
  }
  return '';
}

module.exports = getFrontEndFramework;
