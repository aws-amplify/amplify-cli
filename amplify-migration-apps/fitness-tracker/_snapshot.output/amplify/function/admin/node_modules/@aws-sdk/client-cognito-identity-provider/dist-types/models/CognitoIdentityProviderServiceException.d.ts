import { type ServiceExceptionOptions as __ServiceExceptionOptions, ServiceException as __ServiceException } from "@smithy/smithy-client";
export type { __ServiceExceptionOptions };
export { __ServiceException };
/**
 * @public
 *
 * Base exception class for all service exceptions from CognitoIdentityProvider service.
 */
export declare class CognitoIdentityProviderServiceException extends __ServiceException {
    /**
     * @internal
     */
    constructor(options: __ServiceExceptionOptions);
}
