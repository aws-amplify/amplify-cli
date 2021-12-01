"use strict";
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
/* eslint-disable max-classes-per-file */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockTemplateRenderer = exports.MockOutputManager = void 0;
const frontend_manager_template_renderer_1 = require("../../frontend-manager-template-renderer");
const framework_output_manager_1 = require("../../framework-output-manager");
class MockOutputManager extends framework_output_manager_1.FrameworkOutputManager {
    writeComponent() {
        return new Promise((resolve) => {
            resolve();
        });
    }
}
exports.MockOutputManager = MockOutputManager;
class MockTemplateRenderer extends frontend_manager_template_renderer_1.FrontendManagerTemplateRenderer {
    renderComponentInternal() {
        return {
            componentText: this.component.name || '',
            renderComponentToFilesystem: jest.fn(),
        };
    }
}
exports.MockTemplateRenderer = MockTemplateRenderer;
//# sourceMappingURL=mock-classes.js.map