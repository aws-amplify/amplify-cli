const getFrontendHandler = require('./getFrontEndHandler');

function getFrontEndFramework(context) {
  const { amplify } = context;
  const fontendHandler = getFrontendHandler(context);
  if (fontendHandler === 'javascript') {
    const projectConfig = amplify.getProjectConfig();
    return projectConfig.javascript.framework;
  }
  return '';
}

module.exports = getFrontEndFramework;
