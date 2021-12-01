"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_with_children_renderer_base_1 = require("../component-with-children-renderer-base");
class MockComponentRenderer extends component_with_children_renderer_base_1.ComponentWithChildrenRendererBase {
    renderElement(renderChildren) {
        return `${this.component.name},${renderChildren(this.component.children || []).join(',')}`;
    }
}
describe('ComponentWithChildrenRendererBase', () => {
    test('renderElement', () => {
        expect(new MockComponentRenderer({
            componentType: 'Button',
            name: 'MyButton',
            properties: {},
            children: [
                {
                    componentType: 'Text',
                    name: 'MyText',
                    properties: {},
                },
            ],
        }).renderElement((children) => children.map((child) => child.name))).toEqual('MyButton,MyText');
    });
});
//# sourceMappingURL=component-with-children-renderer-base.test.js.map