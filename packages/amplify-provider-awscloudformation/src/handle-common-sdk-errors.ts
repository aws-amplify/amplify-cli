import { AmplifyError, AmplifyErrorType } from '@aws-amplify/amplify-cli-core';

type CommonExceptionEntry = {
  messageIndicator: RegExp;
  amplifyErrorType: AmplifyErrorType;
  newMessage?: string;
  resolution: string;
};

const commonExceptions: CommonExceptionEntry[] = [
  {
    messageIndicator: /Rate Exceeded/,
    amplifyErrorType: 'APIRateExceededError',
    resolution: 'Try again later.',
  },
  {
    messageIndicator:
      /User: .* is not authorized to perform: .*:.* on resource: .* because no identity-based policy allows the .*:.* action/,
    amplifyErrorType: 'PermissionsError',
    resolution: 'Update the permissions.',
  },
];

export const handleCommonSdkError = (error: Error): Error => {
  for (const commonException of commonExceptions) {
    if (error.message?.match(commonException.messageIndicator)) {
      return new AmplifyError(commonException.amplifyErrorType, {
        message: commonException.newMessage ? commonException.newMessage : error.message,
        resolution: commonException.resolution,
      });
    }
  }
  return error;
};
