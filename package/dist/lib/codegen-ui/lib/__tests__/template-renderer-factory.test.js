"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const template_renderer_factory_1 = require("../template-renderer-factory");
const mock_classes_1 = require("./__utils__/mock-classes");
describe('FrontendManagerTemplateRendererFactory', () => {
    test('buildRenderer', () => {
        const componentName = 'MyText';
        const outputManager = new mock_classes_1.MockOutputManager();
        const renderer = new template_renderer_factory_1.FrontendManagerTemplateRendererFactory((component) => new mock_classes_1.MockTemplateRenderer(component, outputManager, {})).buildRenderer({
            componentType: 'Text',
            name: componentName,
            properties: {},
            bindingProperties: {},
        });
        expect(renderer.renderComponent()).toEqual({
            componentText: componentName,
            renderComponentToFilesystem: expect.any(Function),
        });
    });
});
//# sourceMappingURL=template-renderer-factory.test.js.map