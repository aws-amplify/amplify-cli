"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockTemplateRenderer = void 0;
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
const react_frontend_manager_template_renderer_1 = require("../../react-frontend-manager-template-renderer");
class MockTemplateRenderer extends react_frontend_manager_template_renderer_1.ReactFrontendManagerTemplateRenderer {
    renderJsx() {
        return typescript_1.factory.createJsxFragment(typescript_1.factory.createJsxOpeningFragment(), [], typescript_1.factory.createJsxJsxClosingFragment());
    }
}
exports.MockTemplateRenderer = MockTemplateRenderer;
//# sourceMappingURL=mock-classes.js.map