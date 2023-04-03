"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyException = void 0;
const cliConstants_1 = require("../cliConstants");
class AmplifyException extends Error {
    constructor(name, classification, options, downstreamException) {
        var _a;
        super(options.message);
        this.name = name;
        this.classification = classification;
        this.options = options;
        this.downstreamException = downstreamException;
        this.toObject = () => {
            const { name: errorName, message: errorMessage, details: errorDetails, resolution, link, stack } = this;
            return {
                errorName,
                errorMessage,
                errorDetails,
                resolution,
                link,
                ...(process.argv.includes('--debug') ? { stack } : {}),
            };
        };
        Object.setPrototypeOf(this, AmplifyException.prototype);
        this.message = options.message;
        this.details = options.details;
        this.resolution = options.resolution;
        this.code = options.code;
        this.link = (_a = options.link) !== null && _a !== void 0 ? _a : cliConstants_1.AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url;
    }
}
exports.AmplifyException = AmplifyException;
//# sourceMappingURL=amplify-exception.js.map