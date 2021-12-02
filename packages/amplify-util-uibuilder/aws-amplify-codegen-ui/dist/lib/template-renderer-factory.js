"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendManagerTemplateRendererFactory = void 0;
/**
 * This class is used to wrap the created of renderers due to each renderer
 * only being used for one component.
 */
class FrontendManagerTemplateRendererFactory {
    constructor(renderer) {
        this.renderer = renderer;
    }
    buildRenderer(component) {
        return this.renderer(component);
    }
}
exports.FrontendManagerTemplateRendererFactory = FrontendManagerTemplateRendererFactory;
//# sourceMappingURL=template-renderer-factory.js.map