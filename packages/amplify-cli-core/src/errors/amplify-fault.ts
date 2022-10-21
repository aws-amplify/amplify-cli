import { AMPLIFY_SUPPORT_DOCS } from '../cliConstants';
import {
  AmplifyException, AmplifyExceptionOptions, AmplifyFaultType, PartialAmplifyExceptionOptions,
} from './amplify-exception';

/**
 * Base class for all Amplify faults
 */
export class AmplifyFault extends AmplifyException {
  /**
   * Create a new Amplify Fault
   *
   * @param {AmplifyErrorType} name - a user friendly name for the exception
   * @param {AmplifyExceptionOptions} options - error stack, resolution steps, details, or help links
   *
   * @param {Error | null} downstreamException If you are throwing this exception from within a catch block,
   * you must provide the exception that was caught.
   * @example
   * try {
   *  ...
   * } catch (downstreamException){
   *    throw new AmplifyFault(downstreamException,...,...);
   * }
   */
  constructor(
    name: AmplifyFaultType,
    options: AmplifyExceptionOptions,
    downstreamException?: Error,
  ) {
    super(name, 'FAULT', options, downstreamException);
  }
}

/**
 * returns an amplify fault with the default troubleshooting link if not passed
 */
export const amplifyFaultWithTroubleshootingLink = (
  name: AmplifyFaultType,
  options: PartialAmplifyExceptionOptions,
  downstreamException?: Error,
)
  : AmplifyFault => new AmplifyFault(
  name, {
    ...options,
    link: 'link' in options && options.link ? options.link : AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url,
  },
  downstreamException,
);

const gitHubIssueLink = 'https://github.com/aws-amplify/amplify-cli/issues/new/choose';

/**
 * Creates an AmplifyFault with a default resolution pointing customers to report the issue on GitHub
 */
export const amplifyFaultWithIssueReportLink = (
  name: AmplifyFaultType,
  options: PartialAmplifyExceptionOptions,
  downstreamException?: Error,
): AmplifyFault => new AmplifyFault(name, { ...options, resolution: `Report this issue at ${gitHubIssueLink}` }, downstreamException);
