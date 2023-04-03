"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIContextEnvironmentProvider = void 0;
class CLIContextEnvironmentProvider {
    constructor(context) {
        this.context = context;
        if (!context) {
            throw new Error('CLIContextEnvironmentProvider expects a context instance');
        }
    }
    getCurrentEnvName() {
        var _a;
        try {
            const envInfo = this.context.getEnvInfo();
            return envInfo ? (_a = envInfo.envName) !== null && _a !== void 0 ? _a : '' : '';
        }
        catch (_b) {
            return '';
        }
    }
}
exports.CLIContextEnvironmentProvider = CLIContextEnvironmentProvider;
//# sourceMappingURL=cliContextEnvironmentProvider.js.map