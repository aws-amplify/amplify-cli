/* eslint-disable max-classes-per-file */

export class NotImplementedError extends Error {}
export class ResourceAlreadyExistsError extends Error {}
export class ResourceCredentialsNotFoundError extends Error {}
export class UnknownResourceTypeError extends Error {}
export class UnknownArgumentError extends Error {}
export class MissingParametersError extends Error {}
export class InvalidSubCommandError extends Error {}
export class AngularConfigNotFoundError extends Error {}
export class UnrecognizedFrameworkError extends Error {}
export class UnrecognizedFrontendError extends Error {}
export class ConfigurationError extends Error {}
export class CustomPoliciesFormatError extends Error {}
export class ExportPathValidationError extends Error {}
export class ExportedStackNotFoundError extends Error {}
export class ExportedStackNotInValidStateError extends Error {}
export class DebugConfigValueNotSetError extends Error {}
export class DiagnoseReportUploadError extends Error {}

/**
 *  amplify cli error when cfn resource not exists
 */
export class ResourceDoesNotExistError extends Error {
  public constructor(errMessage: string) {
    super();
    this.name = "ResourceDoesNotExistError";
    this.message = errMessage;
    this.stack = undefined;
  }
}

/**
 *  amplify cli error when cfn resources exceeds service limits
 */
export class ResourceCountLimitExceedError extends Error {
  public constructor(errMessage: string) {
    super();
    this.name = "ResourceCountLimitExceedError";
    this.message = errMessage;
    this.stack = undefined;
  }
}
