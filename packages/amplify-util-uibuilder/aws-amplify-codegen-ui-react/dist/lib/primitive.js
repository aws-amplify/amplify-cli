"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBuiltInIcon = exports.PrimitiveTypeParameter = exports.PrimitiveChildrenPropMapping = exports.isPrimitive = void 0;
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
const typescript_1 = require("typescript");
const iconset_1 = __importDefault(require("./iconset"));
var Primitive;
(function (Primitive) {
    Primitive["Alert"] = "Alert";
    Primitive["Badge"] = "Badge";
    Primitive["Button"] = "Button";
    Primitive["ButtonGroup"] = "ButtonGroup";
    Primitive["Card"] = "Card";
    Primitive["CheckboxField"] = "CheckboxField";
    Primitive["Collection"] = "Collection";
    Primitive["Divider"] = "Divider";
    Primitive["Flex"] = "Flex";
    Primitive["Grid"] = "Grid";
    Primitive["Heading"] = "Heading";
    Primitive["Icon"] = "Icon";
    Primitive["Image"] = "Image";
    Primitive["Link"] = "Link";
    Primitive["Loader"] = "Loader";
    Primitive["Pagination"] = "Pagination";
    Primitive["PasswordField"] = "PasswordField";
    Primitive["PhoneNumberField"] = "PhoneNumberField";
    Primitive["Placeholder"] = "Placeholder";
    Primitive["Radio"] = "Radio";
    Primitive["RadioGroupField"] = "RadioGroupField";
    Primitive["Rating"] = "Rating";
    Primitive["ScrollView"] = "ScrollView";
    Primitive["SearchField"] = "SearchField";
    Primitive["SelectField"] = "SelectField";
    Primitive["SliderField"] = "SliderField";
    Primitive["StepperField"] = "StepperField";
    Primitive["SwitchField"] = "SwitchField";
    Primitive["Tabs"] = "Tabs";
    Primitive["TabItem"] = "TabItem";
    Primitive["Text"] = "Text";
    Primitive["TextField"] = "TextField";
    Primitive["ToggleButton"] = "ToggleButton";
    Primitive["ToggleButtonGroup"] = "ToggleButtonGroup";
    Primitive["View"] = "View";
    Primitive["VisuallyHidden"] = "VisuallyHidden";
})(Primitive || (Primitive = {}));
exports.default = Primitive;
function isPrimitive(componentType) {
    return Object.values(Primitive).includes(componentType);
}
exports.isPrimitive = isPrimitive;
exports.PrimitiveChildrenPropMapping = {
    [Primitive.Alert]: 'label',
    [Primitive.Badge]: 'label',
    [Primitive.Button]: 'label',
    [Primitive.Heading]: 'label',
    [Primitive.Link]: 'label',
    // [Primitive.MenuButton]: 'label',
    // [Primitive.MenuItem]: 'label',
    [Primitive.Radio]: 'label',
    // [Primitive.TableCell]: 'label',
    [Primitive.Text]: 'label',
    [Primitive.ToggleButton]: 'label',
};
exports.PrimitiveTypeParameter = {
    [Primitive.TextField]: {
        declaration: () => [
            typescript_1.factory.createTypeParameterDeclaration(typescript_1.factory.createIdentifier('Multiline'), typescript_1.factory.createKeywordTypeNode(typescript_1.SyntaxKind.BooleanKeyword), undefined),
        ],
        reference: () => [typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier('Multiline'), undefined)],
    },
    [Primitive.Collection]: {
        declaration: () => undefined,
        reference: () => [typescript_1.factory.createKeywordTypeNode(typescript_1.SyntaxKind.AnyKeyword)],
    },
};
function isBuiltInIcon(componentType) {
    return iconset_1.default.has(componentType);
}
exports.isBuiltInIcon = isBuiltInIcon;
//# sourceMappingURL=primitive.js.map