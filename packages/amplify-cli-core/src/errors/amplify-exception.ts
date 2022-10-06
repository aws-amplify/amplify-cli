/**
 * Base class for all Amplify exceptions
 */
export abstract class AmplifyException extends Error {
  public readonly message: string;
  public readonly resolution?: string;
  public readonly details?: string;
  public readonly link?: string;

  /**
   * You should use AmplifyError or AmplifyFault to throw an exception.
   *
   * @param {Error | null} downstreamException If you are throwing this exception from within a catch block,
   * you must provide the exception that was caught.
   * @example
   * try {
   *  ...
   * } catch (downstreamException){
   *    throw new AmplifyError(downstreamException,...,...);
   * }
   * @param {AmplifyExceptionType} name - a user friendly name for the exception
   * @param {AmplifyExceptionClassification} classification - Fault or Error
   * @param {AmplifyExceptionOptions} options - error stack, resolution steps, details, or help links
   */
  constructor(
    public readonly downstreamException: Error | null,
    public readonly name: AmplifyExceptionType,
    public readonly classification: AmplifyExceptionClassification,
    private readonly options: AmplifyExceptionOptions,
  ) {
    // If an AmplifyException was already thrown, we must allow it to reach the user.
    // This ensures that resolution steps, and the original error are bubbled up.
    super(downstreamException instanceof AmplifyException ? downstreamException.message : options.message);

    // https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, AmplifyException.prototype);

    if (downstreamException instanceof AmplifyException) {
      this.stack = downstreamException.stack;
      this.message = downstreamException.message;
      this.details = downstreamException.details;
      this.resolution = downstreamException.resolution;
      this.link = downstreamException.link;
    } else {
      this.stack = options.stack;
      this.message = options.message;
      this.details = options.details;
      this.resolution = 'resolution' in options ? options.resolution : undefined;
      this.link = 'link' in options ? options.link : undefined;
    }
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
 * Amplify Error partial options object
 */
export type PartialAmplifyExceptionOptions = Partial<AmplifyExceptionOptions> & {
  message: string;
};

/**
 * Amplify exception types
 */
export type AmplifyExceptionType = AmplifyErrorType | AmplifyFaultType;

/**
 * Amplify error types
 */
export type AmplifyErrorType =
  | 'AmplifyStudioError'
  | 'AmplifyStudioLoginError'
  | 'AmplifyStudioNotEnabledError'
  | 'ApiCategorySchemaNotFoundError'
  | 'AuthImportError'
  | 'BucketAlreadyExistsError'
  | 'BucketNotFoundError'
  | 'CategoryNotEnabledError'
  | 'CloudFormationTemplateError'
  | 'CommandNotSupportedError'
  | 'ConfigurationError'
  | 'DeploymentError'
  | 'DeploymentInProgressError'
  | 'DirectoryError'
  | 'DirectoryAlreadyExistsError'
  | 'DuplicateLogicalIdError'
  | 'EnvironmentConfigurationError'
  | 'EnvironmentNameError'
  | 'EnvironmentNotInitializedError'
  | 'FeatureFlagsValidationError'
  | 'FrameworkNotSupportedError'
  | 'FunctionTooLargeError'
  | 'InputValidationError'
  | 'InvalidAmplifyAppIdError'
  | 'InvalidStackError'
  | 'IterativeRollbackError'
  | 'LambdaLayerDeleteError'
  | 'MigrationError'
  | 'MissingAmplifyMetaFileError'
  | 'ModelgenError'
  | 'NestedProjectInitError'
  | 'NoUpdateBackendError'
  | 'NotImplementedError'
  | 'ParameterNotFoundError'
  | 'PermissionsError'
  | 'PluginMethodNotFoundError'
  | 'PluginNotFoundError'
  | 'ProfileConfigurationError'
  | 'ProjectAppIdResolveError'
  | 'ProjectInitError'
  | 'ProjectNotFoundError'
  | 'ProjectNotInitializedError'
  | 'PushResourcesError'
  | 'RegionNotAvailableError'
  | 'StackNotFoundError'
  | 'StackStateError';

/**
 * Amplify fault types
 */
export type AmplifyFaultType =
  | 'AmplifyBackupFault'
  | 'BackendPullFault'
  | 'BackendDeleteFault'
  | 'DeploymentFault'
  | 'NotImplementedFault'
  | 'ProjectDeleteFault'
  | 'ProjectInitFault'
  | 'PluginNotLoadedFault'
  | 'PushResourcesFault'
  | 'PullBackendFault'
  | 'ResourceExportFault'
  | 'ResourceNotFoundFault'
  | 'ResourceNotReadyFault'
  | 'RootStackNotFoundFault'
  | 'ServiceCallFault'
  | 'TimeoutFault'
  | 'UnexpectedS3Fault'
  | 'UnknownFault'
  | 'UnknownNodeJSFault';
