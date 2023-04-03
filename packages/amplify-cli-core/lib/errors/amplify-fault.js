"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyFault = void 0;
const amplify_exception_1 = require("./amplify-exception");
class AmplifyFault extends amplify_exception_1.AmplifyException {
    constructor(name, options, downstreamException) {
        super(name, 'FAULT', options, downstreamException);
    }
}
exports.AmplifyFault = AmplifyFault;
//# sourceMappingURL=amplify-fault.js.map