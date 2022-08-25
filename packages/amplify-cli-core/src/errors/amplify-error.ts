/**
 * Base class for all Amplify errors
 */
export class AmplifyError extends Error {
  public readonly message: string;
  public readonly resolution?: string;
  public readonly details?: string;
  public readonly link?: string;
  public readonly classification?: AmplifyErrorClassification;

  constructor(
    public readonly name: AmplifyErrorType,
    readonly options: AmplifyErrorOptions,
  ) {
    super(options.message);

    // https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, AmplifyError.prototype);

    this.stack ??= options.stack;
    this.message = options.message;
    this.details = options.details;
    this.classification = options.classification;
    this.resolution = 'resolution' in options ? options.resolution : undefined;
    this.link = 'link' in options ? options.link : undefined;
  }

  toJson = (): string => {
    const {
      name: errorName, message: errorMessage, details: errorDetails, resolution, link, stack,
    } = this;

    return JSON.stringify({
      errorName, errorMessage, errorDetails, resolution, link, ...(process.argv.includes('--debug') ? { stack } : {}),
    }, null, 2);
  }
}

/**
 * Amplify error classifications
 * InvalidProjectConfiguration: The project is in a bad state and we can't handle the request
 * UnhandledErrorCase: Unhandled error case
 * ServiceCallFailure: Service call failed
 */
export type AmplifyErrorClassification = 'InvalidProjectConfiguration' | 'UnhandledErrorCase' | 'ServiceCallFailure'

/**
 * Amplify Error options object
 */
export type AmplifyErrorOptions = {
  message: string,
  details?: string,
  classification?: AmplifyErrorClassification,
  stack?: string,
} & ({
  resolution: string
} | {
  link: string
});

/**
 * Amplify error types
 */
export type AmplifyErrorType =
  | 'ProjectInitError'
  | 'FeatureFlagsValidationError'
  | 'NotImplementedError'
  | 'UnknownErrorType'
  | 'UnknownNodeJSError';
