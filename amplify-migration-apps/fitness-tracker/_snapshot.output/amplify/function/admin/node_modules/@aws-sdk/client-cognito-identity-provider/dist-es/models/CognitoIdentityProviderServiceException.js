import { ServiceException as __ServiceException, } from "@smithy/smithy-client";
export { __ServiceException };
export class CognitoIdentityProviderServiceException extends __ServiceException {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, CognitoIdentityProviderServiceException.prototype);
    }
}
