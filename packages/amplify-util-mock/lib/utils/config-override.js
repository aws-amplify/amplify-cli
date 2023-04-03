"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigOverrideManager = void 0;
const index_1 = require("./index");
class ConfigOverrideManager {
    constructor(context) {
        this.amplifyMeta = {};
        this.overrides = {};
        context.amplify.addCleanUpTask(async (context) => {
            await this.restoreFrontendExports(context);
        });
    }
    addOverride(category, override) {
        this.overrides[category] = override;
    }
    async generateOverriddenFrontendExports(context) {
        const meta = await (0, index_1.getAmplifyMeta)(context);
        await context.amplify.onCategoryOutputsChange(context, null, {
            ...meta,
            ...this.overrides,
        });
    }
    async restoreFrontendExports(context) {
        await context.amplify.onCategoryOutputsChange(context, null, this.amplifyMeta);
    }
    static async getInstance(context) {
        if (!ConfigOverrideManager.instance) {
            const configOverrideManager = new ConfigOverrideManager(context);
            configOverrideManager.amplifyMeta = await (0, index_1.getAmplifyMeta)(context);
            ConfigOverrideManager.instance = configOverrideManager;
        }
        return ConfigOverrideManager.instance;
    }
}
exports.ConfigOverrideManager = ConfigOverrideManager;
ConfigOverrideManager.instance = null;
//# sourceMappingURL=config-override.js.map