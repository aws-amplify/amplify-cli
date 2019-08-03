import { getAmplifyMeta } from './index';
import { addCleanupTask } from './cleanup-task';
let instance: ConfigOverrideManager = null;
export class ConfigOverrideManager {
  private overrides: {};
  constructor(context) {
    this.overrides = {};
    addCleanupTask(context, async () => {
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
    if (!instance) {
      instance = new ConfigOverrideManager(context);
    }
    return instance;
  }
}
