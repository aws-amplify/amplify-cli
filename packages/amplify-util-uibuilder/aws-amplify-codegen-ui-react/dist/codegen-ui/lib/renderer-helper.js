"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSimplePropertyBinding = exports.isStoragePropertyBinding = exports.isAuthPropertyBinding = exports.isDataPropertyBinding = exports.isFrontendManagerComponentWithActions = exports.isFrontendManagerComponentWithVariants = exports.isFrontendManagerComponentWithCollectionProperties = exports.isFrontendManagerComponentWithBinding = exports.FrontendManagerRendererConstants = void 0;
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
const types_1 = require("./types");
exports.FrontendManagerRendererConstants = {
    unknownName: 'unknown_component_name',
};
function isFrontendManagerComponentWithBinding(component) {
    return 'bindingProperties' in component;
}
exports.isFrontendManagerComponentWithBinding = isFrontendManagerComponentWithBinding;
/**
 * Verify if this is 1) a type that has the collectionProperties, and 2) that the collection
 * properties object is set. Then provide the typehint back to the compiler that this attribute exists.
 */
function isFrontendManagerComponentWithCollectionProperties(component) {
    return 'collectionProperties' in component && component.collectionProperties !== undefined;
}
exports.isFrontendManagerComponentWithCollectionProperties = isFrontendManagerComponentWithCollectionProperties;
function isFrontendManagerComponentWithVariants(component) {
    return 'variants' in component && component.variants !== undefined && component.variants.length > 0;
}
exports.isFrontendManagerComponentWithVariants = isFrontendManagerComponentWithVariants;
function isFrontendManagerComponentWithActions(component) {
    return 'actions' in component && component.actions !== undefined;
}
exports.isFrontendManagerComponentWithActions = isFrontendManagerComponentWithActions;
function isDataPropertyBinding(prop) {
    return 'type' in prop && prop.type === 'Data';
}
exports.isDataPropertyBinding = isDataPropertyBinding;
function isAuthPropertyBinding(prop) {
    return 'type' in prop && prop.type === 'Authentication';
}
exports.isAuthPropertyBinding = isAuthPropertyBinding;
function isStoragePropertyBinding(prop) {
    return 'type' in prop && prop.type === 'Storage';
}
exports.isStoragePropertyBinding = isStoragePropertyBinding;
function isSimplePropertyBinding(prop) {
    return ('type' in prop &&
        [
            types_1.FrontendManagerComponentPropertyType.Boolean.toString(),
            types_1.FrontendManagerComponentPropertyType.Number.toString(),
            types_1.FrontendManagerComponentPropertyType.String.toString(),
            types_1.FrontendManagerComponentPropertyType.Date.toString(),
        ].includes(prop.type));
}
exports.isSimplePropertyBinding = isSimplePropertyBinding;
//# sourceMappingURL=renderer-helper.js.map