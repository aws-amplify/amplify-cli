import { CognitoIdentityProviderServiceException as __BaseException } from "./CognitoIdentityProviderServiceException";
export class InternalErrorException extends __BaseException {
    name = "InternalErrorException";
    $fault = "server";
    constructor(opts) {
        super({
            name: "InternalErrorException",
            $fault: "server",
            ...opts,
        });
        Object.setPrototypeOf(this, InternalErrorException.prototype);
    }
}
export class InvalidParameterException extends __BaseException {
    name = "InvalidParameterException";
    $fault = "client";
    reasonCode;
    constructor(opts) {
        super({
            name: "InvalidParameterException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidParameterException.prototype);
        this.reasonCode = opts.reasonCode;
    }
}
export class NotAuthorizedException extends __BaseException {
    name = "NotAuthorizedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "NotAuthorizedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, NotAuthorizedException.prototype);
    }
}
export class ResourceNotFoundException extends __BaseException {
    name = "ResourceNotFoundException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ResourceNotFoundException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
    }
}
export class TooManyRequestsException extends __BaseException {
    name = "TooManyRequestsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "TooManyRequestsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TooManyRequestsException.prototype);
    }
}
export class UserImportInProgressException extends __BaseException {
    name = "UserImportInProgressException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UserImportInProgressException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UserImportInProgressException.prototype);
    }
}
export class UserNotFoundException extends __BaseException {
    name = "UserNotFoundException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UserNotFoundException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UserNotFoundException.prototype);
    }
}
export class InvalidLambdaResponseException extends __BaseException {
    name = "InvalidLambdaResponseException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidLambdaResponseException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidLambdaResponseException.prototype);
    }
}
export class LimitExceededException extends __BaseException {
    name = "LimitExceededException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "LimitExceededException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, LimitExceededException.prototype);
    }
}
export class TooManyFailedAttemptsException extends __BaseException {
    name = "TooManyFailedAttemptsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "TooManyFailedAttemptsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TooManyFailedAttemptsException.prototype);
    }
}
export class UnexpectedLambdaException extends __BaseException {
    name = "UnexpectedLambdaException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UnexpectedLambdaException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UnexpectedLambdaException.prototype);
    }
}
export class UserLambdaValidationException extends __BaseException {
    name = "UserLambdaValidationException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UserLambdaValidationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UserLambdaValidationException.prototype);
    }
}
export class CodeDeliveryFailureException extends __BaseException {
    name = "CodeDeliveryFailureException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "CodeDeliveryFailureException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, CodeDeliveryFailureException.prototype);
    }
}
export class InvalidPasswordException extends __BaseException {
    name = "InvalidPasswordException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidPasswordException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidPasswordException.prototype);
    }
}
export class InvalidSmsRoleAccessPolicyException extends __BaseException {
    name = "InvalidSmsRoleAccessPolicyException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidSmsRoleAccessPolicyException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidSmsRoleAccessPolicyException.prototype);
    }
}
export class InvalidSmsRoleTrustRelationshipException extends __BaseException {
    name = "InvalidSmsRoleTrustRelationshipException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidSmsRoleTrustRelationshipException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidSmsRoleTrustRelationshipException.prototype);
    }
}
export class PreconditionNotMetException extends __BaseException {
    name = "PreconditionNotMetException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "PreconditionNotMetException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, PreconditionNotMetException.prototype);
    }
}
export class UnsupportedUserStateException extends __BaseException {
    name = "UnsupportedUserStateException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UnsupportedUserStateException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UnsupportedUserStateException.prototype);
    }
}
export class UsernameExistsException extends __BaseException {
    name = "UsernameExistsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UsernameExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UsernameExistsException.prototype);
    }
}
export class AliasExistsException extends __BaseException {
    name = "AliasExistsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "AliasExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, AliasExistsException.prototype);
    }
}
export class InvalidUserPoolConfigurationException extends __BaseException {
    name = "InvalidUserPoolConfigurationException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidUserPoolConfigurationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidUserPoolConfigurationException.prototype);
    }
}
export class InvalidEmailRoleAccessPolicyException extends __BaseException {
    name = "InvalidEmailRoleAccessPolicyException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidEmailRoleAccessPolicyException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidEmailRoleAccessPolicyException.prototype);
    }
}
export class MFAMethodNotFoundException extends __BaseException {
    name = "MFAMethodNotFoundException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "MFAMethodNotFoundException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, MFAMethodNotFoundException.prototype);
    }
}
export class PasswordResetRequiredException extends __BaseException {
    name = "PasswordResetRequiredException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "PasswordResetRequiredException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, PasswordResetRequiredException.prototype);
    }
}
export class UnsupportedOperationException extends __BaseException {
    name = "UnsupportedOperationException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UnsupportedOperationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UnsupportedOperationException.prototype);
    }
}
export class UserNotConfirmedException extends __BaseException {
    name = "UserNotConfirmedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UserNotConfirmedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UserNotConfirmedException.prototype);
    }
}
export class UserPoolAddOnNotEnabledException extends __BaseException {
    name = "UserPoolAddOnNotEnabledException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UserPoolAddOnNotEnabledException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UserPoolAddOnNotEnabledException.prototype);
    }
}
export class CodeMismatchException extends __BaseException {
    name = "CodeMismatchException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "CodeMismatchException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, CodeMismatchException.prototype);
    }
}
export class ExpiredCodeException extends __BaseException {
    name = "ExpiredCodeException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ExpiredCodeException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ExpiredCodeException.prototype);
    }
}
export class PasswordHistoryPolicyViolationException extends __BaseException {
    name = "PasswordHistoryPolicyViolationException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "PasswordHistoryPolicyViolationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, PasswordHistoryPolicyViolationException.prototype);
    }
}
export class SoftwareTokenMFANotFoundException extends __BaseException {
    name = "SoftwareTokenMFANotFoundException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "SoftwareTokenMFANotFoundException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, SoftwareTokenMFANotFoundException.prototype);
    }
}
export class ConcurrentModificationException extends __BaseException {
    name = "ConcurrentModificationException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ConcurrentModificationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ConcurrentModificationException.prototype);
    }
}
export class ForbiddenException extends __BaseException {
    name = "ForbiddenException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ForbiddenException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ForbiddenException.prototype);
    }
}
export class WebAuthnChallengeNotFoundException extends __BaseException {
    name = "WebAuthnChallengeNotFoundException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "WebAuthnChallengeNotFoundException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, WebAuthnChallengeNotFoundException.prototype);
    }
}
export class WebAuthnClientMismatchException extends __BaseException {
    name = "WebAuthnClientMismatchException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "WebAuthnClientMismatchException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, WebAuthnClientMismatchException.prototype);
    }
}
export class WebAuthnCredentialNotSupportedException extends __BaseException {
    name = "WebAuthnCredentialNotSupportedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "WebAuthnCredentialNotSupportedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, WebAuthnCredentialNotSupportedException.prototype);
    }
}
export class WebAuthnNotEnabledException extends __BaseException {
    name = "WebAuthnNotEnabledException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "WebAuthnNotEnabledException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, WebAuthnNotEnabledException.prototype);
    }
}
export class WebAuthnOriginNotAllowedException extends __BaseException {
    name = "WebAuthnOriginNotAllowedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "WebAuthnOriginNotAllowedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, WebAuthnOriginNotAllowedException.prototype);
    }
}
export class WebAuthnRelyingPartyMismatchException extends __BaseException {
    name = "WebAuthnRelyingPartyMismatchException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "WebAuthnRelyingPartyMismatchException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, WebAuthnRelyingPartyMismatchException.prototype);
    }
}
export class DeviceKeyExistsException extends __BaseException {
    name = "DeviceKeyExistsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "DeviceKeyExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, DeviceKeyExistsException.prototype);
    }
}
export class GroupExistsException extends __BaseException {
    name = "GroupExistsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "GroupExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, GroupExistsException.prototype);
    }
}
export class DuplicateProviderException extends __BaseException {
    name = "DuplicateProviderException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "DuplicateProviderException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, DuplicateProviderException.prototype);
    }
}
export class ManagedLoginBrandingExistsException extends __BaseException {
    name = "ManagedLoginBrandingExistsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ManagedLoginBrandingExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ManagedLoginBrandingExistsException.prototype);
    }
}
export class TermsExistsException extends __BaseException {
    name = "TermsExistsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "TermsExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TermsExistsException.prototype);
    }
}
export class FeatureUnavailableInTierException extends __BaseException {
    name = "FeatureUnavailableInTierException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "FeatureUnavailableInTierException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, FeatureUnavailableInTierException.prototype);
    }
}
export class TierChangeNotAllowedException extends __BaseException {
    name = "TierChangeNotAllowedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "TierChangeNotAllowedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TierChangeNotAllowedException.prototype);
    }
}
export class UserPoolTaggingException extends __BaseException {
    name = "UserPoolTaggingException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UserPoolTaggingException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UserPoolTaggingException.prototype);
    }
}
export class InvalidOAuthFlowException extends __BaseException {
    name = "InvalidOAuthFlowException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidOAuthFlowException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidOAuthFlowException.prototype);
    }
}
export class ScopeDoesNotExistException extends __BaseException {
    name = "ScopeDoesNotExistException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ScopeDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ScopeDoesNotExistException.prototype);
    }
}
export class UnsupportedIdentityProviderException extends __BaseException {
    name = "UnsupportedIdentityProviderException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UnsupportedIdentityProviderException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UnsupportedIdentityProviderException.prototype);
    }
}
export class RefreshTokenReuseException extends __BaseException {
    name = "RefreshTokenReuseException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "RefreshTokenReuseException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, RefreshTokenReuseException.prototype);
    }
}
export class UnauthorizedException extends __BaseException {
    name = "UnauthorizedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UnauthorizedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UnauthorizedException.prototype);
    }
}
export class UnsupportedTokenTypeException extends __BaseException {
    name = "UnsupportedTokenTypeException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UnsupportedTokenTypeException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UnsupportedTokenTypeException.prototype);
    }
}
export class WebAuthnConfigurationMissingException extends __BaseException {
    name = "WebAuthnConfigurationMissingException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "WebAuthnConfigurationMissingException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, WebAuthnConfigurationMissingException.prototype);
    }
}
export class EnableSoftwareTokenMFAException extends __BaseException {
    name = "EnableSoftwareTokenMFAException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "EnableSoftwareTokenMFAException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, EnableSoftwareTokenMFAException.prototype);
    }
}
