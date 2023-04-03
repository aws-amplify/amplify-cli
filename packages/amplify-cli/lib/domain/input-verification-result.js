"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputVerificationResult = void 0;
class InputVerificationResult {
    constructor(verified = false, helpCommandAvailable = false, message = undefined) {
        this.verified = verified;
        this.helpCommandAvailable = helpCommandAvailable;
        this.message = message;
    }
}
exports.InputVerificationResult = InputVerificationResult;
//# sourceMappingURL=input-verification-result.js.map