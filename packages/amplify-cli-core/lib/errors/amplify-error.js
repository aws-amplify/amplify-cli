"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyError = void 0;
const amplify_exception_1 = require("./amplify-exception");
class AmplifyError extends amplify_exception_1.AmplifyException {
    constructor(name, options, downstreamException) {
        super(name, 'ERROR', options, downstreamException);
    }
}
exports.AmplifyError = AmplifyError;
//# sourceMappingURL=amplify-error.js.map