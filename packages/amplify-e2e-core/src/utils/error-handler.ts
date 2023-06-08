import { ExecutionContext } from '..';

export const errorReportingTestHandler = (chain: ExecutionContext) => {
  chain
    .wait(
      'An unexpected error has occurred, opt in to send an error report to AWS Amplify with non-sensitive project configuration files. Confirm (y/N)',
    )
    .sendYes();
};
