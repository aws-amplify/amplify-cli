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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyRenderer = void 0;
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
const codegen_ui_1 = require("../codegen-ui");
const primitive_1 = __importStar(require("../primitive"));
const iconset_1 = require("../iconset");
const react_frontend_manager_template_renderer_1 = require("../react-frontend-manager-template-renderer");
const customComponent_1 = __importDefault(require("./customComponent"));
const collection_1 = __importDefault(require("./collection"));
const react_component_with_children_renderer_1 = require("../react-component-with-children-renderer");
const react_component_renderer_1 = require("../react-component-renderer");
class AmplifyRenderer extends react_frontend_manager_template_renderer_1.ReactFrontendManagerTemplateRenderer {
    renderJsx(component, parent) {
        const node = new codegen_ui_1.FrontendManagerNode(component, parent);
        const renderChildren = (children) => children.map((child) => this.renderJsx(child, node));
        if ((0, primitive_1.isBuiltInIcon)(component.componentType)) {
            return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer({
                ...component,
                componentType: iconset_1.iconsetPascalNameMapping.get(component.componentType) || component.componentType,
            }, this.importCollection, parent).renderElement(renderChildren);
        }
        // add Primitive in alphabetical order
        switch (component.componentType) {
            case primitive_1.default.Alert:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Badge:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Button:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.ButtonGroup:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Card:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.CheckboxField:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Collection:
                return new collection_1.default(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Divider:
                return new react_component_renderer_1.ReactComponentRenderer(component, this.importCollection, parent).renderElement();
            case primitive_1.default.Flex:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Grid:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Heading:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Icon:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Image:
                return new react_component_renderer_1.ReactComponentRenderer(component, this.importCollection, parent).renderElement();
            case primitive_1.default.Link:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Loader:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Pagination:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.PasswordField:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.PhoneNumberField:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Placeholder:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Radio:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.RadioGroupField:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Rating:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.ScrollView:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.SearchField:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.SelectField:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.SliderField:
                return new react_component_renderer_1.ReactComponentRenderer(component, this.importCollection, parent).renderElement();
            case primitive_1.default.StepperField:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.SwitchField:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.TabItem:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Tabs:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.Text:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.TextField:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.ToggleButton:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.ToggleButtonGroup:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.View:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            case primitive_1.default.VisuallyHidden:
                return new react_component_with_children_renderer_1.ReactComponentWithChildrenRenderer(component, this.importCollection, parent).renderElement(renderChildren);
            default:
                return new customComponent_1.default(component, this.importCollection, parent).renderElement(renderChildren);
        }
    }
}
exports.AmplifyRenderer = AmplifyRenderer;
//# sourceMappingURL=amplify-renderer.js.map