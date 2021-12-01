"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactComponentRenderer = void 0;
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
class ReactComponentRenderer extends codegen_ui_1.ComponentRendererBase {
    constructor(component, importCollection, parent) {
        super(component, parent);
        this.importCollection = importCollection;
        this.parent = parent;
        (0, react_component_render_helper_1.addBindingPropertiesImports)(component, importCollection);
    }
    renderElement() {
        const element = typescript_1.factory.createJsxElement(this.renderOpeningElement(), [], typescript_1.factory.createJsxClosingElement(typescript_1.factory.createIdentifier(this.component.componentType)));
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
}
exports.ReactComponentRenderer = ReactComponentRenderer;
//# sourceMappingURL=react-component-renderer.js.map