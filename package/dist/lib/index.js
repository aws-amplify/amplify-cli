"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportCollection = void 0;
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
__exportStar(require("./react-component-with-children-renderer"), exports);
__exportStar(require("./react-component-renderer"), exports);
var import_collection_1 = require("./import-collection");
Object.defineProperty(exports, "ImportCollection", { enumerable: true, get: function () { return import_collection_1.ImportCollection; } });
__exportStar(require("./react-frontend-manager-template-renderer"), exports);
__exportStar(require("./react-theme-frontend-manager-template-renderer"), exports);
__exportStar(require("./react-output-config"), exports);
__exportStar(require("./react-render-config"), exports);
__exportStar(require("./react-output-manager"), exports);
__exportStar(require("./amplify-ui-renderers/amplify-renderer"), exports);
__exportStar(require("./primitive"), exports);
__exportStar(require("./react-index-frontend-manager-template-renderer"), exports);
//# sourceMappingURL=index.js.map