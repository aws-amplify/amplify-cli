import { Redactor, getAmplifyLogger } from 'amplify-cli-logger';

export const getLogger = (moduleName: string, fileName: string) => {
  return {
    info: (message: string, args: any = {}) => {
      getAmplifyLogger().logInfo({ message: `${moduleName}.${fileName}.${message}(${Redactor(JSON.stringify(args))}` });
    },
    error: (message: string, error: Error) => {
      getAmplifyLogger().logError({ message: `${moduleName}.${fileName}.${message}`, error });
    },
  };
};
