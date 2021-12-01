"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frontend_manager_node_1 = require("../frontend-manager-node");
const common_component_renderer_1 = require("../common-component-renderer");
class MockComponentRenderer extends common_component_renderer_1.CommonComponentRenderer {
}
describe('common-component-renderer', () => {
    test('constructor', () => {
        const component = {
            componentType: 'Button',
            name: 'MyButton',
            properties: {
                value: { value: 'Confirm' },
            },
        };
        const parent = new frontend_manager_node_1.FrontendManagerNode({
            componentType: 'View',
            name: 'MyView',
            properties: {},
        });
        const renderer = new MockComponentRenderer(component, parent);
        expect(renderer).toMatchSnapshot();
    });
});
//# sourceMappingURL=common-component-renderer.test.js.map