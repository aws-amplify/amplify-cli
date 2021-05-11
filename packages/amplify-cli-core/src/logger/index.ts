import { Redactor, logger } from 'amplify-cli-logger';

export const getLogger = (moduleName: string, fileName: string) => {
  return {
    info: (message: string, args: any = {}) => {
      logger.logInfo({ message: `${moduleName}.${fileName}.${message}(${Redactor(JSON.stringify(args))}` });
    },
    error: (message: string, error: Error) => {
      logger.logError({ message: `${moduleName}.${fileName}.${message}`, error });
    },
  };
};
