"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const react_component_with_children_renderer_1 = require("../react-component-with-children-renderer");
class CustomComponentRenderer extends react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer {
    renderElement(renderChildren) {
        const children = this.component.children ? this.component.children : [];
        const element = typescript_1.factory.createJsxElement(this.renderOpeningElement(), renderChildren(children), typescript_1.factory.createJsxClosingElement(typescript_1.factory.createIdentifier(this.component.componentType)));
        this.importCollection.addImport(`./${this.component.componentType}`, 'default');
        return element;
    }
}
exports.default = CustomComponentRenderer;
//# sourceMappingURL=customComponent.js.map