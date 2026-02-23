import { ExceptionOptionType as __ExceptionOptionType } from "@smithy/smithy-client";
import { CognitoIdentityProviderServiceException as __BaseException } from "./CognitoIdentityProviderServiceException";
export declare class InternalErrorException extends __BaseException {
  readonly name: "InternalErrorException";
  readonly $fault: "server";
  constructor(
    opts: __ExceptionOptionType<InternalErrorException, __BaseException>
  );
}
export declare class InvalidParameterException extends __BaseException {
  readonly name: "InvalidParameterException";
  readonly $fault: "client";
  reasonCode?: string | undefined;
  constructor(
    opts: __ExceptionOptionType<InvalidParameterException, __BaseException>
  );
}
export declare class NotAuthorizedException extends __BaseException {
  readonly name: "NotAuthorizedException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<NotAuthorizedException, __BaseException>
  );
}
export declare class ResourceNotFoundException extends __BaseException {
  readonly name: "ResourceNotFoundException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<ResourceNotFoundException, __BaseException>
  );
}
export declare class TooManyRequestsException extends __BaseException {
  readonly name: "TooManyRequestsException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<TooManyRequestsException, __BaseException>
  );
}
export declare class UserImportInProgressException extends __BaseException {
  readonly name: "UserImportInProgressException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UserImportInProgressException, __BaseException>
  );
}
export declare class UserNotFoundException extends __BaseException {
  readonly name: "UserNotFoundException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UserNotFoundException, __BaseException>
  );
}
export declare class InvalidLambdaResponseException extends __BaseException {
  readonly name: "InvalidLambdaResponseException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<InvalidLambdaResponseException, __BaseException>
  );
}
export declare class LimitExceededException extends __BaseException {
  readonly name: "LimitExceededException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<LimitExceededException, __BaseException>
  );
}
export declare class TooManyFailedAttemptsException extends __BaseException {
  readonly name: "TooManyFailedAttemptsException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<TooManyFailedAttemptsException, __BaseException>
  );
}
export declare class UnexpectedLambdaException extends __BaseException {
  readonly name: "UnexpectedLambdaException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UnexpectedLambdaException, __BaseException>
  );
}
export declare class UserLambdaValidationException extends __BaseException {
  readonly name: "UserLambdaValidationException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UserLambdaValidationException, __BaseException>
  );
}
export declare class CodeDeliveryFailureException extends __BaseException {
  readonly name: "CodeDeliveryFailureException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<CodeDeliveryFailureException, __BaseException>
  );
}
export declare class InvalidPasswordException extends __BaseException {
  readonly name: "InvalidPasswordException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<InvalidPasswordException, __BaseException>
  );
}
export declare class InvalidSmsRoleAccessPolicyException extends __BaseException {
  readonly name: "InvalidSmsRoleAccessPolicyException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      InvalidSmsRoleAccessPolicyException,
      __BaseException
    >
  );
}
export declare class InvalidSmsRoleTrustRelationshipException extends __BaseException {
  readonly name: "InvalidSmsRoleTrustRelationshipException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      InvalidSmsRoleTrustRelationshipException,
      __BaseException
    >
  );
}
export declare class PreconditionNotMetException extends __BaseException {
  readonly name: "PreconditionNotMetException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<PreconditionNotMetException, __BaseException>
  );
}
export declare class UnsupportedUserStateException extends __BaseException {
  readonly name: "UnsupportedUserStateException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UnsupportedUserStateException, __BaseException>
  );
}
export declare class UsernameExistsException extends __BaseException {
  readonly name: "UsernameExistsException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UsernameExistsException, __BaseException>
  );
}
export declare class AliasExistsException extends __BaseException {
  readonly name: "AliasExistsException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<AliasExistsException, __BaseException>
  );
}
export declare class InvalidUserPoolConfigurationException extends __BaseException {
  readonly name: "InvalidUserPoolConfigurationException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      InvalidUserPoolConfigurationException,
      __BaseException
    >
  );
}
export declare class InvalidEmailRoleAccessPolicyException extends __BaseException {
  readonly name: "InvalidEmailRoleAccessPolicyException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      InvalidEmailRoleAccessPolicyException,
      __BaseException
    >
  );
}
export declare class MFAMethodNotFoundException extends __BaseException {
  readonly name: "MFAMethodNotFoundException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<MFAMethodNotFoundException, __BaseException>
  );
}
export declare class PasswordResetRequiredException extends __BaseException {
  readonly name: "PasswordResetRequiredException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<PasswordResetRequiredException, __BaseException>
  );
}
export declare class UnsupportedOperationException extends __BaseException {
  readonly name: "UnsupportedOperationException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UnsupportedOperationException, __BaseException>
  );
}
export declare class UserNotConfirmedException extends __BaseException {
  readonly name: "UserNotConfirmedException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UserNotConfirmedException, __BaseException>
  );
}
export declare class UserPoolAddOnNotEnabledException extends __BaseException {
  readonly name: "UserPoolAddOnNotEnabledException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      UserPoolAddOnNotEnabledException,
      __BaseException
    >
  );
}
export declare class CodeMismatchException extends __BaseException {
  readonly name: "CodeMismatchException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<CodeMismatchException, __BaseException>
  );
}
export declare class ExpiredCodeException extends __BaseException {
  readonly name: "ExpiredCodeException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<ExpiredCodeException, __BaseException>
  );
}
export declare class PasswordHistoryPolicyViolationException extends __BaseException {
  readonly name: "PasswordHistoryPolicyViolationException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      PasswordHistoryPolicyViolationException,
      __BaseException
    >
  );
}
export declare class SoftwareTokenMFANotFoundException extends __BaseException {
  readonly name: "SoftwareTokenMFANotFoundException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      SoftwareTokenMFANotFoundException,
      __BaseException
    >
  );
}
export declare class ConcurrentModificationException extends __BaseException {
  readonly name: "ConcurrentModificationException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      ConcurrentModificationException,
      __BaseException
    >
  );
}
export declare class ForbiddenException extends __BaseException {
  readonly name: "ForbiddenException";
  readonly $fault: "client";
  constructor(opts: __ExceptionOptionType<ForbiddenException, __BaseException>);
}
export declare class WebAuthnChallengeNotFoundException extends __BaseException {
  readonly name: "WebAuthnChallengeNotFoundException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      WebAuthnChallengeNotFoundException,
      __BaseException
    >
  );
}
export declare class WebAuthnClientMismatchException extends __BaseException {
  readonly name: "WebAuthnClientMismatchException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      WebAuthnClientMismatchException,
      __BaseException
    >
  );
}
export declare class WebAuthnCredentialNotSupportedException extends __BaseException {
  readonly name: "WebAuthnCredentialNotSupportedException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      WebAuthnCredentialNotSupportedException,
      __BaseException
    >
  );
}
export declare class WebAuthnNotEnabledException extends __BaseException {
  readonly name: "WebAuthnNotEnabledException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<WebAuthnNotEnabledException, __BaseException>
  );
}
export declare class WebAuthnOriginNotAllowedException extends __BaseException {
  readonly name: "WebAuthnOriginNotAllowedException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      WebAuthnOriginNotAllowedException,
      __BaseException
    >
  );
}
export declare class WebAuthnRelyingPartyMismatchException extends __BaseException {
  readonly name: "WebAuthnRelyingPartyMismatchException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      WebAuthnRelyingPartyMismatchException,
      __BaseException
    >
  );
}
export declare class DeviceKeyExistsException extends __BaseException {
  readonly name: "DeviceKeyExistsException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<DeviceKeyExistsException, __BaseException>
  );
}
export declare class GroupExistsException extends __BaseException {
  readonly name: "GroupExistsException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<GroupExistsException, __BaseException>
  );
}
export declare class DuplicateProviderException extends __BaseException {
  readonly name: "DuplicateProviderException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<DuplicateProviderException, __BaseException>
  );
}
export declare class ManagedLoginBrandingExistsException extends __BaseException {
  readonly name: "ManagedLoginBrandingExistsException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      ManagedLoginBrandingExistsException,
      __BaseException
    >
  );
}
export declare class TermsExistsException extends __BaseException {
  readonly name: "TermsExistsException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<TermsExistsException, __BaseException>
  );
}
export declare class FeatureUnavailableInTierException extends __BaseException {
  readonly name: "FeatureUnavailableInTierException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      FeatureUnavailableInTierException,
      __BaseException
    >
  );
}
export declare class TierChangeNotAllowedException extends __BaseException {
  readonly name: "TierChangeNotAllowedException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<TierChangeNotAllowedException, __BaseException>
  );
}
export declare class UserPoolTaggingException extends __BaseException {
  readonly name: "UserPoolTaggingException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UserPoolTaggingException, __BaseException>
  );
}
export declare class InvalidOAuthFlowException extends __BaseException {
  readonly name: "InvalidOAuthFlowException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<InvalidOAuthFlowException, __BaseException>
  );
}
export declare class ScopeDoesNotExistException extends __BaseException {
  readonly name: "ScopeDoesNotExistException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<ScopeDoesNotExistException, __BaseException>
  );
}
export declare class UnsupportedIdentityProviderException extends __BaseException {
  readonly name: "UnsupportedIdentityProviderException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      UnsupportedIdentityProviderException,
      __BaseException
    >
  );
}
export declare class RefreshTokenReuseException extends __BaseException {
  readonly name: "RefreshTokenReuseException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<RefreshTokenReuseException, __BaseException>
  );
}
export declare class UnauthorizedException extends __BaseException {
  readonly name: "UnauthorizedException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UnauthorizedException, __BaseException>
  );
}
export declare class UnsupportedTokenTypeException extends __BaseException {
  readonly name: "UnsupportedTokenTypeException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<UnsupportedTokenTypeException, __BaseException>
  );
}
export declare class WebAuthnConfigurationMissingException extends __BaseException {
  readonly name: "WebAuthnConfigurationMissingException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      WebAuthnConfigurationMissingException,
      __BaseException
    >
  );
}
export declare class EnableSoftwareTokenMFAException extends __BaseException {
  readonly name: "EnableSoftwareTokenMFAException";
  readonly $fault: "client";
  constructor(
    opts: __ExceptionOptionType<
      EnableSoftwareTokenMFAException,
      __BaseException
    >
  );
}
