"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderPipeline = void 0;
class RenderPipeline {
    constructor(renderers) {
        this.renderers = renderers;
        this.render = async () => {
            for (const renderer of this.renderers) {
                await renderer.render();
            }
        };
    }
}
exports.RenderPipeline = RenderPipeline;
//# sourceMappingURL=render_pipeline.js.map