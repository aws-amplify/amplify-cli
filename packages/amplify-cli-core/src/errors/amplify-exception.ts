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
  public readonly code?: string;

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
    this.code = options.code;
    this.link = options.link ?? AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url;
  }

  toObject = (): object => {
    const { name: errorName, message: errorMessage, details: errorDetails, resolution, link, stack } = this;

    return {
      errorName,
      errorMessage,
      errorDetails,
      resolution,
      link,
      ...(process.argv.includes('--debug') ? { stack } : {}),
    };
  };
}

/**
 * Amplify exception classifications
 */
export type AmplifyExceptionClassification = 'FAULT' | 'ERROR';

/**
 * Amplify Error options object
 */
export type AmplifyExceptionOptions = {
  message: string;
  details?: string;
  resolution?: string;
  link?: string;

  // CloudFormation or NodeJS error codes
  code?: string;
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
  | 'APIRateExceededError'
  | 'AuthImportError'
  | 'BackendConfigValidationError'
  | 'BucketAlreadyExistsError'
  | 'BucketNotFoundError'
  | 'CategoryNotEnabledError'
  | 'CloudFormationTemplateError'
  | 'CommandNotSupportedError'
  | 'ConfigurationError'
  | 'CustomPoliciesFormatError'
  | 'DebugConfigValueNotSetError'
  | 'DeploymentError'
  | 'DeploymentInProgressError'
  | 'DestructiveMigrationError'
  | 'DiagnoseReportUploadError'
  | 'DirectoryAlreadyExistsError'
  | 'DirectoryError'
  | 'DuplicateLogicalIdError'
  | 'EnvironmentConfigurationError'
  | 'EnvironmentNameError'
  | 'EnvironmentNotInitializedError'
  | 'ExportError'
  | 'FeatureFlagsValidationError'
  | 'FileSystemPermissionsError'
  | 'FrameworkNotSupportedError'
  | 'FunctionTooLargeError'
  | 'GraphQLError'
  | 'InputValidationError'
  | 'InvalidAmplifyAppIdError'
  | 'InvalidCustomResourceError'
  | 'InvalidDirectiveError'
  | 'InvalidGSIMigrationError'
  | 'InvalidMigrationError'
  | 'InvalidOverrideError'
  | 'InvalidStackError'
  | 'InvalidTransformerError'
  | 'IterativeRollbackError'
  | 'LambdaFunctionInvokeError'
  | 'LambdaLayerDeleteError'
  | 'MigrationError'
  | 'MissingAmplifyMetaFileError'
  | 'MissingExpectedParameterError'
  | 'MissingOverridesInstallationRequirementsError'
  | 'MockProcessError'
  | 'ModelgenError'
  | 'NestedProjectInitError'
  | 'NotImplementedError'
  | 'NoUpdateBackendError'
  | 'OpenSslCertificateError'
  | 'PackagingLambdaFunctionError'
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
  | 'ResourceCountLimitExceedError'
  | 'ResourceDoesNotExistError'
  | 'ResourceInUseError'
  | 'ResourceNotReadyError'
  | 'ResourceRemoveError'
  | 'SchemaNotFoundError'
  | 'SchemaValidationError'
  | 'ScriptingFeaturesDisabledError'
  | 'SearchableMockProcessError'
  | 'SearchableMockUnavailablePortError'
  | 'SearchableMockUnsupportedPlatformError'
  | 'ShellCommandExecutionError'
  | 'StackNotFoundError'
  | 'StackStateError'
  | 'StorageImportError'
  | 'TransformerContractError'
  | 'UnknownDirectiveError'
  | 'UnsupportedLockFileTypeError'
  | 'UserInputError';

/**
 * Amplify fault types
 */
export type AmplifyFaultType =
  | 'AmplifyBackupFault'
  | 'AnalyticsCategoryFault'
  | 'AuthCategoryFault'
  | 'BackendDeleteFault'
  | 'BackendPullFault'
  | 'CloudFormationTemplateFault'
  | 'ConfigurationFault'
  | 'ConfigurationFault'
  | 'DeploymentFault'
  | 'DeploymentStateUploadFault'
  | 'FileNotFoundFault'
  | 'GraphQLTransformerV1Fault'
  | 'LockFileNotFoundFault'
  | 'LockFileParsingFault'
  | 'MockProcessFault'
  | 'NotificationsChannelAPNSFault'
  | 'NotificationsChannelEmailFault'
  | 'NotificationsChannelFCMFault'
  | 'NotificationsChannelInAppMessagingFault'
  | 'NotificationsChannelSmsFault'
  | 'NotImplementedFault'
  | 'ParameterDownloadFault'
  | 'ParameterUploadFault'
  | 'PluginNotLoadedFault'
  | 'ProjectDeleteFault'
  | 'ParametersDeleteFault'
  | 'ProjectInitFault'
  | 'PullBackendFault'
  | 'PushResourcesFault'
  | 'ResourceAddFault'
  | 'ResourceExportFault'
  | 'ResourceNotFoundFault'
  | 'ResourceNotReadyFault'
  | 'ResourceRemoveFault'
  | 'RootStackNotFoundFault'
  | 'ServiceCallFault'
  | 'SnsSandboxModeCheckFault'
  | 'TimeoutFault'
  | 'TriggerUploadFault'
  | 'UnexpectedS3Fault'
  | 'UnknownFault'
  | 'UnknownNodeJSFault'
  | 'ZipExtractFault';
