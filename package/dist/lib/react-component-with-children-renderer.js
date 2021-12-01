"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactComponentWithChildrenRenderer = void 0;
/*
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 */
const codegen_ui_1 = require("./codegen-ui");
const typescript_1 = require("typescript");
const react_component_render_helper_1 = require("./react-component-render-helper");
const primitive_1 = __importStar(require("./primitive"));
class ReactComponentWithChildrenRenderer extends codegen_ui_1.ComponentWithChildrenRendererBase {
    constructor(component, importCollection, parent) {
        super(component, parent);
        this.importCollection = importCollection;
        this.parent = parent;
        this.mapSyntheticProps();
        (0, react_component_render_helper_1.addBindingPropertiesImports)(component, importCollection);
    }
    renderElement(renderChildren) {
        var _a;
        const children = (_a = this.component.children) !== null && _a !== void 0 ? _a : [];
        const element = typescript_1.factory.createJsxElement(this.renderOpeningElement(), renderChildren(children), typescript_1.factory.createJsxClosingElement(typescript_1.factory.createIdentifier(this.component.componentType)));
        this.importCollection.addImport('@aws-amplify/ui-react', this.component.componentType);
        return element;
    }
    renderOpeningElement() {
        const attributes = Object.entries(this.component.properties).map(([key, value]) => (0, react_component_render_helper_1.buildOpeningElementAttributes)(value, key));
        if ('events' in this.component && this.component.events !== undefined) {
            attributes.push(...Object.entries(this.component.events).map(([key, value]) => (0, react_component_render_helper_1.buildOpeningElementActions)(key, value)));
        }
        this.addPropsSpreadAttributes(attributes);
        return typescript_1.factory.createJsxOpeningElement(typescript_1.factory.createIdentifier(this.component.componentType), undefined, typescript_1.factory.createJsxAttributes(attributes));
    }
    renderCollectionOpeningElement(itemsVariableName) {
        const propsArray = Object.entries(this.component.properties).map(([key, value]) => (0, react_component_render_helper_1.buildOpeningElementAttributes)(value, key));
        const itemsAttribute = typescript_1.factory.createJsxAttribute(typescript_1.factory.createIdentifier('items'), typescript_1.factory.createJsxExpression(undefined, typescript_1.factory.createBinaryExpression(typescript_1.factory.createIdentifier(itemsVariableName || 'items'), typescript_1.factory.createToken(typescript_1.SyntaxKind.BarBarToken), typescript_1.factory.createArrayLiteralExpression([], false))));
        propsArray.push(itemsAttribute);
        this.addPropsSpreadAttributes(propsArray);
        return typescript_1.factory.createJsxOpeningElement(typescript_1.factory.createIdentifier(this.component.componentType), undefined, typescript_1.factory.createJsxAttributes(propsArray));
    }
    addPropsSpreadAttributes(attributes) {
        if (this.node.isRoot()) {
            const propsAttr = typescript_1.factory.createJsxSpreadAttribute(typescript_1.factory.createIdentifier('rest'));
            attributes.push(propsAttr);
        }
        const overrideAttr = typescript_1.factory.createJsxSpreadAttribute(typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier('getOverrideProps'), undefined, [
            typescript_1.factory.createIdentifier('overrides'),
            typescript_1.factory.createStringLiteral(this.node.getOverrideKey()),
        ]));
        this.importCollection.addImport('@aws-amplify/ui-react/internal', 'getOverrideProps');
        attributes.push(overrideAttr);
    }
    addBoundExpressionAttributes(attributes, propKey, propName, propValue) {
        const attr = typescript_1.factory.createJsxAttribute(typescript_1.factory.createIdentifier(propKey), typescript_1.factory.createJsxExpression(undefined, typescript_1.factory.createBinaryExpression(typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier('props'), propName), typescript_1.SyntaxKind.QuestionQuestionToken, propValue)));
        attributes.push(attr);
    }
    /* Some additional props are added to Amplify primitives in FrontendManager.
     * These "sythetic" props are mapped to real props on the primitives.
     *
     * Example: Text prop label is mapped to to Text prop Children
     *
     * This is done so that nonadvanced users of FrontendManager do not need to
     * interact with props that might confuse them.
     */
    mapSyntheticProps() {
        // properties.children will take precedent over mapped children prop
        if (this.component.properties.children === undefined) {
            const childrenPropMapping = primitive_1.PrimitiveChildrenPropMapping[primitive_1.default[this.component.componentType]];
            if (childrenPropMapping !== undefined) {
                const mappedChildrenProp = this.component.properties[childrenPropMapping];
                if (mappedChildrenProp !== undefined) {
                    this.component.properties.children = mappedChildrenProp;
                    delete this.component.properties[childrenPropMapping];
                }
            }
        }
    }
}
exports.ReactComponentWithChildrenRenderer = ReactComponentWithChildrenRenderer;
//# sourceMappingURL=react-component-with-children-renderer.js.map