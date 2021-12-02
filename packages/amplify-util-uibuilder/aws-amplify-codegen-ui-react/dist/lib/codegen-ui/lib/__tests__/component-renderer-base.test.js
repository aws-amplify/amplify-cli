"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_renderer_base_1 = require("../component-renderer-base");
class MockComponentRenderer extends component_renderer_base_1.ComponentRendererBase {
    renderElement() {
        return this.component.name || '';
    }
}
describe('ComponentRendererBase', () => {
    test('renderElement', () => {
        const name = 'MyText';
        expect(new MockComponentRenderer({
            componentType: 'Text',
            name,
            properties: {},
        }).renderElement()).toEqual(name);
    });
});
//# sourceMappingURL=component-renderer-base.test.js.map