const { logger, Redactor } = require('amplify-cli-logger');
const mainModule = 'amplify-provider-awscloudformation';

export const fileLogger = file => (crumb, args) => error => {
  const message = `${mainModule}.${file}.${crumb}(${Redactor(JSON.stringify(args))})`;
  if (!error) {
    logger.logInfo({ message });
  } else {
    logger.logError({
      message,
      error,
    });
  }
};

export const logStackEvents = events => {
  logger.logInfo({
    message: events,
  });
};
