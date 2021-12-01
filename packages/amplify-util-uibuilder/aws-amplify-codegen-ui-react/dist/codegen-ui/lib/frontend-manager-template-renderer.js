"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendManagerTemplateRenderer = void 0;
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
const path_1 = __importDefault(require("path"));
const errors_1 = require("./errors");
class FrontendManagerTemplateRenderer {
    /**
     *
     * @param component The first order component to be rendered.
     */
    constructor(component, outputManager, renderConfig) {
        this.component = component;
        this.outputManager = outputManager;
        this.renderConfig = renderConfig;
    }
    /**
     * Renders the entire first order component. It returns the
     * component text and a method for saving the component to the filesystem.
     */
    renderComponent() {
        return this.renderComponentInternal();
    }
    renderComponentToFilesystem(componentContent) {
        return (fileName) => (outputPath) => this.outputManager.writeComponent(componentContent, path_1.default.join(outputPath, fileName));
    }
}
__decorate([
    errors_1.handleCodegenErrors
], FrontendManagerTemplateRenderer.prototype, "renderComponent", null);
exports.FrontendManagerTemplateRenderer = FrontendManagerTemplateRenderer;
//# sourceMappingURL=frontend-manager-template-renderer.js.map