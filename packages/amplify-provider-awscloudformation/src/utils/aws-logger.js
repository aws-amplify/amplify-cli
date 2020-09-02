const { logger } = require('amplify-cli-logger');

export const fileLogger = file => (crumb, args) => error => {
  if (error) {
    logError({
      mod: `${file}.${crumb}`,
      args,
      error,
    });
  } else {
    logInfo({
      mod: `${file}.${crumb}`,
      args,
    });
  }
};

export function logStackEvents(events) {
  logger.logInfo({
    module: events,
    isStackEvent: true,
    args: [],
  });
}

const logInfo = ({ mod, args }) => {
  logger.logInfo({
    module: `aws-provider-awscloudformation.${mod}`,
    args,
  });
};

const logError = ({ mod, args, error }) => {
  logger.logError({
    module: `aws-provider-awscloudformation.${mod}`,
    args,
    error,
  });
};
