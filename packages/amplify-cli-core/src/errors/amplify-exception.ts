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

    this.stack = options.stack ?? this.stack;
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
  | 'AuthImportError'
  | 'BucketAlreadyExistsError'
  | 'BucketNotFoundError'
  | 'CategoryNotEnabledError'
  | 'CloudFormationTemplateError'
  | 'CommandNotSupportedError'
  | 'ConfigurationError'
  | 'DeploymentError'
  | 'DeploymentInProgressError'
  | 'DuplicateLogicalIdError'
  | 'EnvironmentNameError'
  | 'EnvironmentNotInitializedError'
  | 'FeatureFlagsValidationError'
  | 'FrameworkNotSupportedError'
  | 'FunctionTooLargeError'
  | 'InputValidationError'
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
  | 'BackendPullFault'
  | 'DeploymentFault'
  | 'NotImplementedFault'
  | 'ProjectDeleteFault'
  | 'ProjectInitFault'
  | 'PushResourcesFault'
  | 'ResourceExportFault'
  | 'ResourceNotFoundFault'
  | 'ResourceNotReadyFault'
  | 'RootStackNotFoundFault'
  | 'ServiceCallFault'
  | 'TimeoutFault'
  | 'UnexpectedS3Fault'
  | 'UnknownFault'
  | 'UnknownNodeJSFault';
