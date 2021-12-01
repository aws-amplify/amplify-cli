"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const codegen_ui_1 = require("../codegen-ui");
const react_component_renderer_1 = require("../react-component-renderer");
class SampleCodeRenderer extends react_component_renderer_1.ReactComponentRenderer {
    renderElement() {
        var _a;
        const tagName = (_a = this.component.name) !== null && _a !== void 0 ? _a : codegen_ui_1.FrontendManagerRendererConstants.unknownName;
        // const prop = new Map<string, BoundFrontendManagerComponentProperty>();
        // this.collectExposedProps(this.component, prop);
        const propsArray = [];
        /*  TODO:  move over to boundProperties
        const defaultValue = 'defaultValue';
        const defaultValueExpr = factory.createJsxExpression(undefined, factory.createIdentifier(defaultValue));
        props?.forEach((value, key) => {
          if (value.exposedAs) {
            const displayExpr =
              value.value !== undefined ? factory.createStringLiteral(value.value.toString()) : defaultValueExpr;
            const attr = factory.createJsxAttribute(factory.createIdentifier(key), displayExpr);
            propsArray.push(attr);
          }
        });
        */
        return typescript_1.factory.createJsxSelfClosingElement(typescript_1.factory.createIdentifier(tagName), undefined, typescript_1.factory.createJsxAttributes(propsArray));
    }
    /*
    private collectExposedProps(
      component: FrontendManagerComponent,
      collected: Map<string, FrontendManagerComponentProperty>,
    ) {
      const moreItems = Object.entries(component.properties).filter((m) => !(m[1].exposedAs == null));
      moreItems?.forEach((value, index) => {
        if (!collected.has(value[0])) {
          collected.set(value[0], value[1]);
        }
      });
  
      component.children?.forEach((child) => {
        this.collectExposedProps(child, collected);
      });
    }
    */
    addExposedPropAttributes(attributes, tagName) {
        const propsAttr = typescript_1.factory.createJsxSpreadAttribute(typescript_1.factory.createIdentifier('props'));
        attributes.push(propsAttr);
        const overrideAttr = typescript_1.factory.createJsxSpreadAttribute(typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier('getOverrideProps'), undefined, [
            typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier('props'), typescript_1.factory.createIdentifier('overrides')),
            typescript_1.factory.createStringLiteral(tagName),
        ]));
        attributes.push(overrideAttr);
    }
    mapProps(props) {
        return props;
    }
}
exports.default = SampleCodeRenderer;
//# sourceMappingURL=sampleCodeRenderer.js.map