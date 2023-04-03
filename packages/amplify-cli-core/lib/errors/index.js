"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceCountLimitExceedError = exports.ResourceDoesNotExistError = exports.DiagnoseReportUploadError = exports.DebugConfigValueNotSetError = exports.ExportedStackNotInValidStateError = exports.ExportedStackNotFoundError = exports.ExportPathValidationError = exports.CustomPoliciesFormatError = exports.ConfigurationError = exports.UnrecognizedFrontendError = exports.UnrecognizedFrameworkError = exports.AngularConfigNotFoundError = exports.InvalidSubCommandError = exports.MissingParametersError = exports.UnknownArgumentError = exports.UnknownResourceTypeError = exports.ResourceCredentialsNotFoundError = exports.ResourceAlreadyExistsError = exports.NotImplementedError = void 0;
const amplify_error_1 = require("./amplify-error");
class NotImplementedError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('NotImplementedError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'NotImplementedError' });
    }
}
exports.NotImplementedError = NotImplementedError;
class ResourceAlreadyExistsError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('ResourceAlreadyExistsError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'ResourceAlreadyExistsError' });
    }
}
exports.ResourceAlreadyExistsError = ResourceAlreadyExistsError;
class ResourceCredentialsNotFoundError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('PermissionsError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'ResourceCredentialsNotFoundError' });
    }
}
exports.ResourceCredentialsNotFoundError = ResourceCredentialsNotFoundError;
class UnknownResourceTypeError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('ResourceDoesNotExistError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'UnknownResourceTypeError' });
    }
}
exports.UnknownResourceTypeError = UnknownResourceTypeError;
class UnknownArgumentError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('UserInputError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'UnknownArgumentError' });
    }
}
exports.UnknownArgumentError = UnknownArgumentError;
class MissingParametersError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('ParameterNotFoundError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'MissingParametersError' });
    }
}
exports.MissingParametersError = MissingParametersError;
class InvalidSubCommandError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('CommandNotSupportedError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'InvalidSubCommandError' });
    }
}
exports.InvalidSubCommandError = InvalidSubCommandError;
class AngularConfigNotFoundError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('ConfigurationError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'AngularConfigNotFoundError' });
    }
}
exports.AngularConfigNotFoundError = AngularConfigNotFoundError;
class UnrecognizedFrameworkError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('ConfigurationError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'UnrecognizedFrameworkError' });
    }
}
exports.UnrecognizedFrameworkError = UnrecognizedFrameworkError;
class UnrecognizedFrontendError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('ConfigurationError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'UnrecognizedFrontendError' });
    }
}
exports.UnrecognizedFrontendError = UnrecognizedFrontendError;
class ConfigurationError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('ConfigurationError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'ConfigurationError' });
    }
}
exports.ConfigurationError = ConfigurationError;
class CustomPoliciesFormatError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('CustomPoliciesFormatError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'CustomPoliciesFormatError' });
    }
}
exports.CustomPoliciesFormatError = CustomPoliciesFormatError;
class ExportPathValidationError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('ExportError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'ExportPathValidationError' });
    }
}
exports.ExportPathValidationError = ExportPathValidationError;
class ExportedStackNotFoundError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('StackNotFoundError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'ExportedStackNotFoundError' });
    }
}
exports.ExportedStackNotFoundError = ExportedStackNotFoundError;
class ExportedStackNotInValidStateError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('StackStateError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'ExportedStackNotInValidStateError' });
    }
}
exports.ExportedStackNotInValidStateError = ExportedStackNotInValidStateError;
class DebugConfigValueNotSetError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('DebugConfigValueNotSetError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'ResourceDoesNotExistError' });
    }
}
exports.DebugConfigValueNotSetError = DebugConfigValueNotSetError;
class DiagnoseReportUploadError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('DiagnoseReportUploadError', { message: errMessage !== null && errMessage !== void 0 ? errMessage : 'DiagnoseReportUploadError' });
    }
}
exports.DiagnoseReportUploadError = DiagnoseReportUploadError;
class ResourceDoesNotExistError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('ResourceDoesNotExistError', { message: errMessage });
    }
}
exports.ResourceDoesNotExistError = ResourceDoesNotExistError;
class ResourceCountLimitExceedError extends amplify_error_1.AmplifyError {
    constructor(errMessage) {
        super('ResourceCountLimitExceedError', { message: errMessage });
    }
}
exports.ResourceCountLimitExceedError = ResourceCountLimitExceedError;
//# sourceMappingURL=index.js.map