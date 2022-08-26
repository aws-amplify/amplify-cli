/**
 * Base class for all Amplify exceptions
 */
export class AmplifyException extends Error {
  public readonly message: string;
  public readonly resolution?: string;
  public readonly details?: string;
  public readonly link?: string;

  constructor(
    public readonly name: AmplifyExceptionType,
    public readonly classification: AmplifyExceptionClassification,
    private readonly options: AmplifyExceptionOptions,
  ) {
    super(options.message);

    // https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, AmplifyException.prototype);

    this.stack ??= options.stack;
    this.message = options.message;
    this.details = options.details;
    this.resolution = 'resolution' in options ? options.resolution : undefined;
    this.link = 'link' in options ? options.link : undefined;
  }

  toObject = (): object => {
    const {
      name: errorName, message: errorMessage, details: errorDetails, resolution, link, stack,
    } = this;

    return {
      errorName, errorMessage, errorDetails, resolution, link, ...(process.argv.includes('--debug') ? { stack } : {}),
    };
  }
}

/**
 * Amplify exception classifications
 */
export type AmplifyExceptionClassification = 'FAULT' | 'ERROR';

/**
 * Amplify Error options object
 */
export type AmplifyExceptionOptions = {
  message: string,
  details?: string,
  stack?: string,
} & ({
  resolution: string
} | {
  link: string
});

/**
 * Amplify exception types
 */
export type AmplifyExceptionType = AmplifyErrorType | AmplifyFaultType;

/**
 * Amplify error types
 */
export type AmplifyErrorType =
  | 'CommandNotSupportedError'
  | 'MigrationError'
  | 'InputValidationError'
  | 'ProjectInitError'
  | 'NestedProjectInitError'
  | 'FeatureFlagsValidationError'
  | 'EnvironmentNameError'
  | 'NotImplementedError';

/**
 * Amplify fault types
 */
export type AmplifyFaultType =
  | 'ProjectInitFault'
  | 'UnknownFaultType'
  | 'UnknownNodeJSFault';
