// eslint-disable-next-line import/no-cycle
import { AMPLIFY_SUPPORT_DOCS } from '../cliConstants';

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
   * @param {AmplifyExceptionType} name - a user friendly name for the exception
   * @param {AmplifyExceptionClassification} classification - Fault or Error
   * @param {AmplifyExceptionOptions} options - error stack, resolution steps, details, or help links
   * @param {Error | null} downstreamException If you are throwing this exception from within a catch block,
   * you must provide the exception that was caught.
   * @example
   * try {
   *  ...
   * } catch (downstreamException){
   *    throw new AmplifyError(...,...,downstreamException);
   * }
   */
  constructor(
    public readonly name: AmplifyExceptionType,
    public readonly classification: AmplifyExceptionClassification,
    public readonly options: AmplifyExceptionOptions,
    public readonly downstreamException?: Error,
  ) {
    // If an AmplifyException was already thrown, we must allow it to reach the user.
    // This ensures that resolution steps, and the original error are bubbled up.
    super(options.message);

    // https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, AmplifyException.prototype);

    this.message = options.message;
    this.details = options.details;
    this.resolution = options.resolution;
    this.link = options.link ?? AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url;
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
  resolution?: string,
  link?: string,
};

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
  | 'BackendConfigValidationError'
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
  | 'InvalidCustomResourceError'
  | 'InvalidOverrideError'
  | 'InvalidStackError'
  | 'IterativeRollbackError'
  | 'LambdaLayerDeleteError'
  | 'MigrationError'
  | 'MissingAmplifyMetaFileError'
  | 'MissingOverridesInstallationRequirementsError'
  | 'ModelgenError'
  | 'NestedProjectInitError'
  | 'NoUpdateBackendError'
  | 'NotImplementedError'
  | 'OpenSslCertificateError'
  | 'ParameterNotFoundError'
  | 'PermissionsError'
  | 'PluginMethodNotFoundError'
  | 'PluginNotFoundError'
  | 'PluginPolicyAddError'
  | 'ProfileConfigurationError'
  | 'ProjectAppIdResolveError'
  | 'ProjectInitError'
  | 'ProjectNotFoundError'
  | 'ProjectNotInitializedError'
  | 'PushResourcesError'
  | 'RegionNotAvailableError'
  | 'RemoveNotificationAppError'
  | 'ResourceAlreadyExistsError'
  | 'ResourceInUseError'
  | 'ResourceNotReadyError'
  | 'StackNotFoundError'
  | 'StackStateError'
  | 'UserInputError'
  | 'MockProcessError'
  | 'SearchableMockUnsupportedPlatformError'
  | 'SearchableMockUnavailablePortError'
  | 'SearchableMockProcessError';

/**
 * Amplify fault types
 */
export type AmplifyFaultType =
  | 'AnalyticsCategoryFault'
  | 'AmplifyBackupFault'
  | 'BackendPullFault'
  | 'ConfigurationFault'
  | 'BackendDeleteFault'
  | 'ConfigurationFault'
  | 'DeploymentFault'
  | 'NotificationsChannelAPNSFault'
  | 'NotificationsChannelEmailFault'
  | 'NotificationsChannelFCMFault'
  | 'NotificationsChannelSmsFault'
  | 'NotificationsChannelInAppMessagingFault'
  | 'NotImplementedFault'
  | 'ProjectDeleteFault'
  | 'ProjectInitFault'
  | 'PluginNotLoadedFault'
  | 'PushResourcesFault'
  | 'PullBackendFault'
  | 'ResourceExportFault'
  | 'ResourceNotFoundFault'
  | 'ResourceNotReadyFault'
  | 'ResourceRemoveFault'
  | 'RootStackNotFoundFault'
  | 'ServiceCallFault'
  | 'TimeoutFault'
  | 'TriggerUploadFault'
  | 'UnexpectedS3Fault'
  | 'UnknownFault'
  | 'UnknownNodeJSFault'
  | 'MockProcessFault'
  | 'AuthCategoryFault'
  | 'ZipExtractFault';
