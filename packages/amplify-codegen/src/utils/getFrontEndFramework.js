const getFrontendHandler = require('./getFrontEndHandler');

function getFrontEndFramework(context, withoutInit = false, decoupleFrontend = '', decoupleFramework = '') {
  const { amplify } = context;
  let frontendHandler = decoupleFrontend;
  if (!withoutInit) {
    frontendHandler = getFrontendHandler(context);
  }
  if (frontendHandler === 'javascript') {
    if (!withoutInit) {
      const projectConfig = amplify.getProjectConfig();
      return projectConfig.javascript.framework;
    }
    return decoupleFramework;
  }
  return '';
}

module.exports = getFrontEndFramework;
