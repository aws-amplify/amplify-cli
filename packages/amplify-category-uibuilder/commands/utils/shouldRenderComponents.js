const logger = require('./logger');

async function shouldRenderComponents(context) {
  if (process.env.FORCE_RENDER) {
    logger.info('Forcing component render since environment variable flag is set.');
    return true;
  }
  if (context.input.options && context.input.options['no-codegen']) {
    logger.warn('Not pulling components because --no-codegen flag is set');
    return false;
  }

  if (!context.exeInfo || !context.exeInfo.projectConfig) {
    logger.warn('Not pulling components because there is no projectConfig set for this project');
    return false;
  }

  if (!context.exeInfo.projectConfig.providers.includes('awscloudformation')) {
    logger.warn('Not pulling components because there is no "awscloudformation" provider');
    return false;
  }

  if (context.exeInfo.projectConfig.frontend !== 'javascript') {
    logger.warn('Not pulling components because this project is not configured as a javascript frontend');
    return false;
  }

  if (context.exeInfo.projectConfig['javascript'].framework !== 'react') {
    logger.warn('Not pulling components because this project is not configured with the "react" framework');
    return false;
  }

  return true;
}

module.exports = {
  shouldRenderComponents,
};
