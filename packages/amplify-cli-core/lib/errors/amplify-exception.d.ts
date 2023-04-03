export declare abstract class AmplifyException extends Error {
    readonly name: AmplifyExceptionType;
    readonly classification: AmplifyExceptionClassification;
    readonly options: AmplifyExceptionOptions;
    readonly downstreamException?: Error | undefined;
    readonly message: string;
    readonly resolution?: string;
    readonly details?: string;
    readonly link?: string;
    readonly code?: string;
    constructor(name: AmplifyExceptionType, classification: AmplifyExceptionClassification, options: AmplifyExceptionOptions, downstreamException?: Error | undefined);
    toObject: () => object;
}
export type AmplifyExceptionClassification = 'FAULT' | 'ERROR';
export type AmplifyExceptionOptions = {
    message: string;
    details?: string;
    resolution?: string;
    link?: string;
    code?: string;
};
export type PartialAmplifyExceptionOptions = Partial<AmplifyExceptionOptions> & {
    message: string;
};
export type AmplifyExceptionType = AmplifyErrorType | AmplifyFaultType;
export type AmplifyErrorType = 'AmplifyStudioError' | 'AmplifyStudioLoginError' | 'AmplifyStudioNotEnabledError' | 'ApiCategorySchemaNotFoundError' | 'AuthImportError' | 'BackendConfigValidationError' | 'BucketAlreadyExistsError' | 'BucketNotFoundError' | 'CategoryNotEnabledError' | 'CloudFormationTemplateError' | 'CommandNotSupportedError' | 'ConfigurationError' | 'CustomPoliciesFormatError' | 'DebugConfigValueNotSetError' | 'DeploymentError' | 'DeploymentInProgressError' | 'DestructiveMigrationError' | 'DiagnoseReportUploadError' | 'DirectoryAlreadyExistsError' | 'DirectoryError' | 'DuplicateLogicalIdError' | 'EnvironmentConfigurationError' | 'EnvironmentNameError' | 'EnvironmentNotInitializedError' | 'ExportError' | 'FeatureFlagsValidationError' | 'FileSystemPermissionsError' | 'FrameworkNotSupportedError' | 'FunctionTooLargeError' | 'GraphQLError' | 'InputValidationError' | 'InvalidAmplifyAppIdError' | 'InvalidCustomResourceError' | 'InvalidDirectiveError' | 'InvalidGSIMigrationError' | 'InvalidMigrationError' | 'InvalidOverrideError' | 'InvalidStackError' | 'InvalidTransformerError' | 'IterativeRollbackError' | 'LambdaFunctionInvokeError' | 'LambdaLayerDeleteError' | 'MigrationError' | 'MissingAmplifyMetaFileError' | 'MissingExpectedParameterError' | 'MissingOverridesInstallationRequirementsError' | 'MockProcessError' | 'ModelgenError' | 'NestedProjectInitError' | 'NotImplementedError' | 'NoUpdateBackendError' | 'OpenSslCertificateError' | 'PackagingLambdaFunctionError' | 'ParameterNotFoundError' | 'PermissionsError' | 'PluginMethodNotFoundError' | 'PluginNotFoundError' | 'PluginPolicyAddError' | 'ProfileConfigurationError' | 'ProjectAppIdResolveError' | 'ProjectInitError' | 'ProjectNotFoundError' | 'ProjectNotInitializedError' | 'PushResourcesError' | 'RegionNotAvailableError' | 'RemoveNotificationAppError' | 'ResourceAlreadyExistsError' | 'ResourceCountLimitExceedError' | 'ResourceDoesNotExistError' | 'ResourceInUseError' | 'ResourceNotReadyError' | 'SchemaNotFoundError' | 'SchemaValidationError' | 'SearchableMockProcessError' | 'SearchableMockUnavailablePortError' | 'SearchableMockUnsupportedPlatformError' | 'StackNotFoundError' | 'StackStateError' | 'StorageImportError' | 'TransformerContractError' | 'UnknownDirectiveError' | 'UnsupportedLockFileTypeError' | 'UserInputError';
export type AmplifyFaultType = 'AmplifyBackupFault' | 'AnalyticsCategoryFault' | 'AuthCategoryFault' | 'BackendDeleteFault' | 'BackendPullFault' | 'ConfigurationFault' | 'ConfigurationFault' | 'DeploymentFault' | 'DeploymentStateUploadFault' | 'FileNotFoundFault' | 'LockFileNotFoundFault' | 'LockFileParsingFault' | 'MockProcessFault' | 'NotificationsChannelAPNSFault' | 'NotificationsChannelEmailFault' | 'NotificationsChannelFCMFault' | 'NotificationsChannelInAppMessagingFault' | 'NotificationsChannelSmsFault' | 'NotImplementedFault' | 'ParameterDownloadFault' | 'ParameterUploadFault' | 'PluginNotLoadedFault' | 'ProjectDeleteFault' | 'ParametersDeleteFault' | 'ProjectInitFault' | 'PullBackendFault' | 'PushResourcesFault' | 'ResourceExportFault' | 'ResourceNotFoundFault' | 'ResourceNotReadyFault' | 'ResourceRemoveFault' | 'RootStackNotFoundFault' | 'ServiceCallFault' | 'SnsSandboxModeCheckFault' | 'TimeoutFault' | 'TriggerUploadFault' | 'UnexpectedS3Fault' | 'UnknownFault' | 'UnknownNodeJSFault' | 'ZipExtractFault';
//# sourceMappingURL=amplify-exception.d.ts.map