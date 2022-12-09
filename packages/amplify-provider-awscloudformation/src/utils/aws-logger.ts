import { Redactor, getAmplifyLogger } from 'amplify-cli-logger';

const mainModule = 'amplify-provider-awscloudformation';

export type Logger = (crumb: string, args: any[]) => (error?: Error) => void;

export const fileLogger = (file: string) => (crumb: string, args: any[]) => (error?: Error) => {
  const message = `${mainModule}.${file}.${crumb}(${Redactor(JSON.stringify(args))})`;
  if (!error) {
    getAmplifyLogger().logInfo({ message });
  } else {
    getAmplifyLogger().logError({
      message,
      error,
    });
  }
};
