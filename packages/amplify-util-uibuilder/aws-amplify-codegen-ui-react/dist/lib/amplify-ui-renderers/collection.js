"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const codegen_ui_1 = require("../codegen-ui");
const typescript_1 = require("typescript");
const react_component_with_children_renderer_1 = require("../react-component-with-children-renderer");
class CollectionRenderer extends react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer {
    renderElement(renderChildren) {
        var _a, _b;
        this.addKeyPropertyToChildren((_a = this.component.children) !== null && _a !== void 0 ? _a : []);
        const childrenJsx = this.component.children ? renderChildren((_b = this.component.children) !== null && _b !== void 0 ? _b : []) : [];
        const arrowFuncExpr = this.renderItemArrowFunctionExpr(childrenJsx);
        const itemsVariableName = this.findItemsVariableName();
        const element = typescript_1.factory.createJsxElement(this.renderCollectionOpeningElement(itemsVariableName), [arrowFuncExpr], typescript_1.factory.createJsxClosingElement(typescript_1.factory.createIdentifier(this.component.componentType)));
        this.importCollection.addImport('@aws-amplify/ui-react', this.component.componentType);
        return element;
    }
    addKeyPropertyToChildren(children) {
        children.forEach((child) => {
            if ('key' in child.properties) {
                return;
            }
            // eslint-disable-next-line no-param-reassign
            child.properties.key = {
                collectionBindingProperties: {
                    property: '',
                    field: 'id',
                },
            };
        });
    }
    findItemsVariableName() {
        var _a;
        if ((0, codegen_ui_1.isFrontendManagerComponentWithCollectionProperties)(this.component)) {
            const collectionProps = Object.entries((_a = this.component.collectionProperties) !== null && _a !== void 0 ? _a : {});
            return collectionProps.length > 0 ? collectionProps[0][0] : undefined;
        }
        return undefined;
    }
    renderItemArrowFunctionExpr(childrenJsx) {
        return typescript_1.factory.createJsxExpression(undefined, typescript_1.factory.createArrowFunction(undefined, undefined, [
            typescript_1.factory.createParameterDeclaration(undefined, undefined, undefined, typescript_1.factory.createIdentifier('item'), undefined, undefined, undefined),
            typescript_1.factory.createParameterDeclaration(undefined, undefined, undefined, typescript_1.factory.createIdentifier('index'), undefined, undefined, undefined),
        ], undefined, typescript_1.factory.createToken(typescript_1.SyntaxKind.EqualsGreaterThanToken), typescript_1.factory.createParenthesizedExpression(childrenJsx[0])));
    }
}
exports.default = CollectionRenderer;
//# sourceMappingURL=collection.js.map