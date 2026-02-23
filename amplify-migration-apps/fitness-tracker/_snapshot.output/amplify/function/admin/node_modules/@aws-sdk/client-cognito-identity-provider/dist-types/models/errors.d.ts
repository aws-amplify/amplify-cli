import type { ExceptionOptionType as __ExceptionOptionType } from "@smithy/smithy-client";
import { CognitoIdentityProviderServiceException as __BaseException } from "./CognitoIdentityProviderServiceException";
/**
 * <p>This exception is thrown when Amazon Cognito encounters an internal error.</p>
 * @public
 */
export declare class InternalErrorException extends __BaseException {
    readonly name: "InternalErrorException";
    readonly $fault: "server";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InternalErrorException, __BaseException>);
}
/**
 * <p>This exception is thrown when the Amazon Cognito service encounters an invalid
 *             parameter.</p>
 * @public
 */
export declare class InvalidParameterException extends __BaseException {
    readonly name: "InvalidParameterException";
    readonly $fault: "client";
    /**
     * <p>The reason code of the exception.</p>
     * @public
     */
    reasonCode?: string | undefined;
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidParameterException, __BaseException>);
}
/**
 * <p>This exception is thrown when a user isn't authorized.</p>
 * @public
 */
export declare class NotAuthorizedException extends __BaseException {
    readonly name: "NotAuthorizedException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<NotAuthorizedException, __BaseException>);
}
/**
 * <p>This exception is thrown when the Amazon Cognito service can't find the requested
 *             resource.</p>
 * @public
 */
export declare class ResourceNotFoundException extends __BaseException {
    readonly name: "ResourceNotFoundException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<ResourceNotFoundException, __BaseException>);
}
/**
 * <p>This exception is thrown when the user has made too many requests for a given
 *             operation.</p>
 * @public
 */
export declare class TooManyRequestsException extends __BaseException {
    readonly name: "TooManyRequestsException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<TooManyRequestsException, __BaseException>);
}
/**
 * <p>This exception is thrown when you're trying to modify a user pool while a user import
 *             job is in progress for that pool.</p>
 * @public
 */
export declare class UserImportInProgressException extends __BaseException {
    readonly name: "UserImportInProgressException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UserImportInProgressException, __BaseException>);
}
/**
 * <p>This exception is thrown when a user isn't found.</p>
 * @public
 */
export declare class UserNotFoundException extends __BaseException {
    readonly name: "UserNotFoundException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UserNotFoundException, __BaseException>);
}
/**
 * <p>This exception is thrown when Amazon Cognito encounters an invalid Lambda response.</p>
 * @public
 */
export declare class InvalidLambdaResponseException extends __BaseException {
    readonly name: "InvalidLambdaResponseException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidLambdaResponseException, __BaseException>);
}
/**
 * <p>This exception is thrown when a user exceeds the limit for a requested Amazon Web Services
 *             resource.</p>
 * @public
 */
export declare class LimitExceededException extends __BaseException {
    readonly name: "LimitExceededException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<LimitExceededException, __BaseException>);
}
/**
 * <p>This exception is thrown when the user has made too many failed attempts for a given
 *             action, such as sign-in.</p>
 * @public
 */
export declare class TooManyFailedAttemptsException extends __BaseException {
    readonly name: "TooManyFailedAttemptsException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<TooManyFailedAttemptsException, __BaseException>);
}
/**
 * <p>This exception is thrown when Amazon Cognito encounters an unexpected exception with
 *             Lambda.</p>
 * @public
 */
export declare class UnexpectedLambdaException extends __BaseException {
    readonly name: "UnexpectedLambdaException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UnexpectedLambdaException, __BaseException>);
}
/**
 * <p>This exception is thrown when the Amazon Cognito service encounters a user validation exception
 *             with the Lambda service.</p>
 * @public
 */
export declare class UserLambdaValidationException extends __BaseException {
    readonly name: "UserLambdaValidationException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UserLambdaValidationException, __BaseException>);
}
/**
 * <p>This exception is thrown when a verification code fails to deliver
 *             successfully.</p>
 * @public
 */
export declare class CodeDeliveryFailureException extends __BaseException {
    readonly name: "CodeDeliveryFailureException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<CodeDeliveryFailureException, __BaseException>);
}
/**
 * <p>This exception is thrown when Amazon Cognito encounters an invalid password.</p>
 * @public
 */
export declare class InvalidPasswordException extends __BaseException {
    readonly name: "InvalidPasswordException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidPasswordException, __BaseException>);
}
/**
 * <p>This exception is returned when the role provided for SMS configuration doesn't have
 *             permission to publish using Amazon SNS.</p>
 * @public
 */
export declare class InvalidSmsRoleAccessPolicyException extends __BaseException {
    readonly name: "InvalidSmsRoleAccessPolicyException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidSmsRoleAccessPolicyException, __BaseException>);
}
/**
 * <p>This exception is thrown when the trust relationship is not valid for the role
 *             provided for SMS configuration. This can happen if you don't trust
 *                 <code>cognito-idp.amazonaws.com</code> or the external ID provided in the role does
 *             not match what is provided in the SMS configuration for the user pool.</p>
 * @public
 */
export declare class InvalidSmsRoleTrustRelationshipException extends __BaseException {
    readonly name: "InvalidSmsRoleTrustRelationshipException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidSmsRoleTrustRelationshipException, __BaseException>);
}
/**
 * <p>This exception is thrown when a precondition is not met.</p>
 * @public
 */
export declare class PreconditionNotMetException extends __BaseException {
    readonly name: "PreconditionNotMetException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<PreconditionNotMetException, __BaseException>);
}
/**
 * <p>The request failed because the user is in an unsupported state.</p>
 * @public
 */
export declare class UnsupportedUserStateException extends __BaseException {
    readonly name: "UnsupportedUserStateException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UnsupportedUserStateException, __BaseException>);
}
/**
 * <p>This exception is thrown when Amazon Cognito encounters a user name that already
 *             exists in the user pool.</p>
 * @public
 */
export declare class UsernameExistsException extends __BaseException {
    readonly name: "UsernameExistsException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UsernameExistsException, __BaseException>);
}
/**
 * <p>This exception is thrown when a user tries to confirm the account with an email
 *             address or phone number that has already been supplied as an alias for a different user
 *             profile. This exception indicates that an account with this email address or phone
 *             already exists in a user pool that you've configured to use email address or phone
 *             number as a sign-in alias.</p>
 * @public
 */
export declare class AliasExistsException extends __BaseException {
    readonly name: "AliasExistsException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<AliasExistsException, __BaseException>);
}
/**
 * <p>This exception is thrown when the user pool configuration is not valid.</p>
 * @public
 */
export declare class InvalidUserPoolConfigurationException extends __BaseException {
    readonly name: "InvalidUserPoolConfigurationException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidUserPoolConfigurationException, __BaseException>);
}
/**
 * <p>This exception is thrown when Amazon Cognito isn't allowed to use your email identity. HTTP
 *             status code: 400.</p>
 * @public
 */
export declare class InvalidEmailRoleAccessPolicyException extends __BaseException {
    readonly name: "InvalidEmailRoleAccessPolicyException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidEmailRoleAccessPolicyException, __BaseException>);
}
/**
 * <p>This exception is thrown when Amazon Cognito can't find a multi-factor authentication
 *             (MFA) method.</p>
 * @public
 */
export declare class MFAMethodNotFoundException extends __BaseException {
    readonly name: "MFAMethodNotFoundException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<MFAMethodNotFoundException, __BaseException>);
}
/**
 * <p>This exception is thrown when a password reset is required.</p>
 * @public
 */
export declare class PasswordResetRequiredException extends __BaseException {
    readonly name: "PasswordResetRequiredException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<PasswordResetRequiredException, __BaseException>);
}
/**
 * <p>Exception that is thrown when you attempt to perform an operation that isn't enabled
 *             for the user pool client.</p>
 * @public
 */
export declare class UnsupportedOperationException extends __BaseException {
    readonly name: "UnsupportedOperationException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UnsupportedOperationException, __BaseException>);
}
/**
 * <p>This exception is thrown when a user isn't confirmed successfully.</p>
 * @public
 */
export declare class UserNotConfirmedException extends __BaseException {
    readonly name: "UserNotConfirmedException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UserNotConfirmedException, __BaseException>);
}
/**
 * <p>This exception is thrown when user pool add-ons aren't enabled.</p>
 * @public
 */
export declare class UserPoolAddOnNotEnabledException extends __BaseException {
    readonly name: "UserPoolAddOnNotEnabledException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UserPoolAddOnNotEnabledException, __BaseException>);
}
/**
 * <p>This exception is thrown if the provided code doesn't match what the server was
 *             expecting.</p>
 * @public
 */
export declare class CodeMismatchException extends __BaseException {
    readonly name: "CodeMismatchException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<CodeMismatchException, __BaseException>);
}
/**
 * <p>This exception is thrown if a code has expired.</p>
 * @public
 */
export declare class ExpiredCodeException extends __BaseException {
    readonly name: "ExpiredCodeException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<ExpiredCodeException, __BaseException>);
}
/**
 * <p>The message returned when a user's new password matches a previous password and
 *             doesn't comply with the password-history policy.</p>
 * @public
 */
export declare class PasswordHistoryPolicyViolationException extends __BaseException {
    readonly name: "PasswordHistoryPolicyViolationException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<PasswordHistoryPolicyViolationException, __BaseException>);
}
/**
 * <p>This exception is thrown when the software token time-based one-time password (TOTP)
 *             multi-factor authentication (MFA) isn't activated for the user pool.</p>
 * @public
 */
export declare class SoftwareTokenMFANotFoundException extends __BaseException {
    readonly name: "SoftwareTokenMFANotFoundException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<SoftwareTokenMFANotFoundException, __BaseException>);
}
/**
 * <p>This exception is thrown if two or more modifications are happening
 *             concurrently.</p>
 * @public
 */
export declare class ConcurrentModificationException extends __BaseException {
    readonly name: "ConcurrentModificationException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<ConcurrentModificationException, __BaseException>);
}
/**
 * <p>This exception is thrown when WAF doesn't allow your request based on a web
 *             ACL that's associated with your user pool.</p>
 * @public
 */
export declare class ForbiddenException extends __BaseException {
    readonly name: "ForbiddenException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<ForbiddenException, __BaseException>);
}
/**
 * <p>This exception is thrown when the challenge from <code>StartWebAuthn</code>
 *             registration has expired.</p>
 * @public
 */
export declare class WebAuthnChallengeNotFoundException extends __BaseException {
    readonly name: "WebAuthnChallengeNotFoundException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<WebAuthnChallengeNotFoundException, __BaseException>);
}
/**
 * <p>This exception is thrown when the access token is for a different client than the one
 *             in the original <code>StartWebAuthnRegistration</code> request.</p>
 * @public
 */
export declare class WebAuthnClientMismatchException extends __BaseException {
    readonly name: "WebAuthnClientMismatchException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<WebAuthnClientMismatchException, __BaseException>);
}
/**
 * <p>This exception is thrown when a user presents passkey credentials from an unsupported
 *             device or provider.</p>
 * @public
 */
export declare class WebAuthnCredentialNotSupportedException extends __BaseException {
    readonly name: "WebAuthnCredentialNotSupportedException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<WebAuthnCredentialNotSupportedException, __BaseException>);
}
/**
 * <p>This exception is thrown when the passkey feature isn't enabled for the user
 *             pool.</p>
 * @public
 */
export declare class WebAuthnNotEnabledException extends __BaseException {
    readonly name: "WebAuthnNotEnabledException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<WebAuthnNotEnabledException, __BaseException>);
}
/**
 * <p>This exception is thrown when the passkey credential's registration origin does not
 *             align with the user pool relying party id.</p>
 * @public
 */
export declare class WebAuthnOriginNotAllowedException extends __BaseException {
    readonly name: "WebAuthnOriginNotAllowedException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<WebAuthnOriginNotAllowedException, __BaseException>);
}
/**
 * <p>This exception is thrown when the given passkey credential is associated with a
 *             different relying party ID than the user pool relying party ID.</p>
 * @public
 */
export declare class WebAuthnRelyingPartyMismatchException extends __BaseException {
    readonly name: "WebAuthnRelyingPartyMismatchException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<WebAuthnRelyingPartyMismatchException, __BaseException>);
}
/**
 * <p>This exception is thrown when a user attempts to confirm a device with a device key
 *             that already exists.</p>
 * @public
 */
export declare class DeviceKeyExistsException extends __BaseException {
    readonly name: "DeviceKeyExistsException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<DeviceKeyExistsException, __BaseException>);
}
/**
 * <p>This exception is thrown when Amazon Cognito encounters a group that already exists in the user
 *             pool.</p>
 * @public
 */
export declare class GroupExistsException extends __BaseException {
    readonly name: "GroupExistsException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<GroupExistsException, __BaseException>);
}
/**
 * <p>This exception is thrown when the provider is already supported by the user
 *             pool.</p>
 * @public
 */
export declare class DuplicateProviderException extends __BaseException {
    readonly name: "DuplicateProviderException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<DuplicateProviderException, __BaseException>);
}
/**
 * <p>This exception is thrown when you attempt to apply a managed login branding style to
 *             an app client that already has an assigned style.</p>
 * @public
 */
export declare class ManagedLoginBrandingExistsException extends __BaseException {
    readonly name: "ManagedLoginBrandingExistsException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<ManagedLoginBrandingExistsException, __BaseException>);
}
/**
 * <p>Terms document names must be unique to the app client. This exception is thrown when
 *             you attempt to create terms documents with a duplicate <code>TermsName</code>.</p>
 * @public
 */
export declare class TermsExistsException extends __BaseException {
    readonly name: "TermsExistsException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<TermsExistsException, __BaseException>);
}
/**
 * <p>This exception is thrown when a feature you attempted to configure isn't
 *             available in your current feature plan.</p>
 * @public
 */
export declare class FeatureUnavailableInTierException extends __BaseException {
    readonly name: "FeatureUnavailableInTierException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<FeatureUnavailableInTierException, __BaseException>);
}
/**
 * <p>This exception is thrown when you've attempted to change your feature plan but
 *             the operation isn't permitted.</p>
 * @public
 */
export declare class TierChangeNotAllowedException extends __BaseException {
    readonly name: "TierChangeNotAllowedException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<TierChangeNotAllowedException, __BaseException>);
}
/**
 * <p>This exception is thrown when a user pool tag can't be set or updated.</p>
 * @public
 */
export declare class UserPoolTaggingException extends __BaseException {
    readonly name: "UserPoolTaggingException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UserPoolTaggingException, __BaseException>);
}
/**
 * <p>This exception is thrown when the specified OAuth flow is not valid.</p>
 * @public
 */
export declare class InvalidOAuthFlowException extends __BaseException {
    readonly name: "InvalidOAuthFlowException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<InvalidOAuthFlowException, __BaseException>);
}
/**
 * <p>This exception is thrown when the specified scope doesn't exist.</p>
 * @public
 */
export declare class ScopeDoesNotExistException extends __BaseException {
    readonly name: "ScopeDoesNotExistException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<ScopeDoesNotExistException, __BaseException>);
}
/**
 * <p>This exception is thrown when the specified identifier isn't supported.</p>
 * @public
 */
export declare class UnsupportedIdentityProviderException extends __BaseException {
    readonly name: "UnsupportedIdentityProviderException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UnsupportedIdentityProviderException, __BaseException>);
}
/**
 * <p>This exception is throw when your application requests token refresh with a refresh
 *             token that has been invalidated by refresh-token rotation.</p>
 * @public
 */
export declare class RefreshTokenReuseException extends __BaseException {
    readonly name: "RefreshTokenReuseException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<RefreshTokenReuseException, __BaseException>);
}
/**
 * <p>Exception that is thrown when the request isn't authorized. This can happen due to an
 *             invalid access token in the request.</p>
 * @public
 */
export declare class UnauthorizedException extends __BaseException {
    readonly name: "UnauthorizedException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UnauthorizedException, __BaseException>);
}
/**
 * <p>Exception that is thrown when an unsupported token is passed to an operation.</p>
 * @public
 */
export declare class UnsupportedTokenTypeException extends __BaseException {
    readonly name: "UnsupportedTokenTypeException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<UnsupportedTokenTypeException, __BaseException>);
}
/**
 * <p>This exception is thrown when a user pool doesn't have a configured relying party
 *             id or a user pool domain.</p>
 * @public
 */
export declare class WebAuthnConfigurationMissingException extends __BaseException {
    readonly name: "WebAuthnConfigurationMissingException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<WebAuthnConfigurationMissingException, __BaseException>);
}
/**
 * <p>This exception is thrown when there is a code mismatch and the service fails to
 *             configure the software token TOTP multi-factor authentication (MFA).</p>
 * @public
 */
export declare class EnableSoftwareTokenMFAException extends __BaseException {
    readonly name: "EnableSoftwareTokenMFAException";
    readonly $fault: "client";
    /**
     * @internal
     */
    constructor(opts: __ExceptionOptionType<EnableSoftwareTokenMFAException, __BaseException>);
}
