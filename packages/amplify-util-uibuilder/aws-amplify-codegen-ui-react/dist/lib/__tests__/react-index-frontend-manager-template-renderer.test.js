"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_index_frontend_manager_template_renderer_1 = require("../react-index-frontend-manager-template-renderer");
// eslint-disable-next-line max-len
class ReactIndexFrontendManagerTemplateRendererWithExposedRenderConfig extends react_index_frontend_manager_template_renderer_1.ReactIndexFrontendManagerTemplateRenderer {
    getRenderConfig() {
        return this.renderConfig;
    }
}
describe('ReactIndexFrontendManagerTemplateRenderer', () => {
    describe('constructor', () => {
        test('overrides renderTypeDeclarations to false', () => {
            const renderer = new ReactIndexFrontendManagerTemplateRendererWithExposedRenderConfig([], {
                renderTypeDeclarations: true,
            });
            expect(renderer.getRenderConfig().renderTypeDeclarations).toBeFalsy();
        });
    });
});
//# sourceMappingURL=react-index-frontend-manager-template-renderer.test.js.map