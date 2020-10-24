import { getAmplifyMeta } from './index';
export class ConfigOverrideManager {
  private static instance: ConfigOverrideManager = null;
  private overrides: {};
  constructor(context) {
    this.overrides = {};
    context.amplify.addCleanUpTask(async context => {
      await this.restoreFrontendExports(context);
    });
  }

  addOverride(category: string, override: {}) {
    this.overrides[category] = override;
  }

  async generateOverriddenFrontendExports(context) {
    const meta = await getAmplifyMeta(context);
    await context.amplify.onCategoryOutputsChange(context, null, {
      ...meta,
      ...this.overrides,
    });
  }

  async restoreFrontendExports(context) {
    const meta = await getAmplifyMeta(context);
    await context.amplify.onCategoryOutputsChange(context, null, meta);
  }

  static getInstance(context: any) {
    if (!ConfigOverrideManager.instance) {
      ConfigOverrideManager.instance = new ConfigOverrideManager(context);
    }
    return ConfigOverrideManager.instance;
  }
}
