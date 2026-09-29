/* eslint-disable max-classes-per-file */

import { AmplifyError } from './amplify-error';

export class NotImplementedError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('NotImplementedError', { message: errMessage ?? 'NotImplementedError' });
  }
}

export class ResourceAlreadyExistsError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('ResourceAlreadyExistsError', { message: errMessage ?? 'ResourceAlreadyExistsError' });
  }
}

export class ResourceCredentialsNotFoundError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('PermissionsError', { message: errMessage ?? 'ResourceCredentialsNotFoundError' });
  }
}

export class UnknownResourceTypeError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('ResourceDoesNotExistError', { message: errMessage ?? 'UnknownResourceTypeError' });
  }
}

export class UnknownArgumentError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('UserInputError', { message: errMessage ?? 'UnknownArgumentError' });
  }
}
export class MissingParametersError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('ParameterNotFoundError', { message: errMessage ?? 'MissingParametersError' });
  }
}

export class InvalidSubCommandError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('CommandNotSupportedError', { message: errMessage ?? 'InvalidSubCommandError' });
  }
}

export class AngularConfigNotFoundError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('ConfigurationError', { message: errMessage ?? 'AngularConfigNotFoundError' });
  }
}

export class UnrecognizedFrameworkError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('ConfigurationError', { message: errMessage ?? 'UnrecognizedFrameworkError' });
  }
}

export class UnrecognizedFrontendError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('ConfigurationError', { message: errMessage ?? 'UnrecognizedFrontendError' });
  }
}

export class ConfigurationError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('ConfigurationError', { message: errMessage ?? 'ConfigurationError' });
  }
}

export class CustomPoliciesFormatError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('CustomPoliciesFormatError', { message: errMessage ?? 'CustomPoliciesFormatError' });
  }
}

export class ExportPathValidationError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('ExportError', { message: errMessage ?? 'ExportPathValidationError' });
  }
}

export class ExportedStackNotFoundError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('StackNotFoundError', { message: errMessage ?? 'ExportedStackNotFoundError' });
  }
}

export class ExportedStackNotInValidStateError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('StackStateError', { message: errMessage ?? 'ExportedStackNotInValidStateError' });
  }
}

export class DebugConfigValueNotSetError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('DebugConfigValueNotSetError', { message: errMessage ?? 'ResourceDoesNotExistError' });
  }
}

export class DiagnoseReportUploadError extends AmplifyError {
  public constructor(errMessage?: string) {
    super('DiagnoseReportUploadError', { message: errMessage ?? 'DiagnoseReportUploadError' });
  }
}

/**
 *  amplify cli error when cfn resource not exists
 */
export class ResourceDoesNotExistError extends AmplifyError {
  public constructor(errMessage: string) {
    super('ResourceDoesNotExistError', { message: errMessage });
  }
}

/**
 *  amplify cli error when cfn resources exceeds service limits
 */
export class ResourceCountLimitExceedError extends AmplifyError {
  public constructor(errMessage: string) {
    super('ResourceCountLimitExceedError', { message: errMessage });
  }
}
