const { logger } = require('amplify-cli-logger');

export const fileLogger = file => (crumb, args) => err => {
  if (err) {
    logError({
      mod: `${file}.${crumb}`,
      args,
      err,
    });
  } else {
    logInfo({
      mod: `${file}.${crumb}`,
      args,
    });
  }
};

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
