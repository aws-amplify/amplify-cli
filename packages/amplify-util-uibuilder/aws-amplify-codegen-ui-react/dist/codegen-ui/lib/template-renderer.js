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
exports.FrontendManagerTemplateRendererManager = void 0;
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
const fs_1 = __importDefault(require("fs"));
const errors_1 = require("./errors");
/**
 * This is a class for genercially rendering FrontendManager templates.
 * The output is determined by the renderer passed into the constructor.
 */
class FrontendManagerTemplateRendererManager {
    constructor(renderer, outputConfig) {
        this.renderer = renderer;
        this.outputConfig = outputConfig;
        const renderPath = this.outputConfig.outputPathDir;
        if (!fs_1.default.existsSync(renderPath)) {
            fs_1.default.mkdirSync(renderPath);
        }
    }
    renderSchemaToTemplate(component) {
        if (!component) {
            throw new errors_1.InvalidInputError('Please ensure you have passed in a valid component schema');
        }
        const componentRenderer = this.renderer.buildRenderer(component);
        const result = componentRenderer.renderComponent();
        result.renderComponentToFilesystem(this.outputConfig.outputPathDir);
        return result;
    }
    renderSchemaToTemplates(jsonSchema) {
        if (!jsonSchema) {
            throw new errors_1.InvalidInputError('Please ensure you have passed in a valid schema');
        }
        for (const component of jsonSchema) {
            this.renderer.buildRenderer(component).renderComponent();
        }
    }
}
__decorate([
    errors_1.handleCodegenErrors
], FrontendManagerTemplateRendererManager.prototype, "renderSchemaToTemplate", null);
__decorate([
    errors_1.handleCodegenErrors
], FrontendManagerTemplateRendererManager.prototype, "renderSchemaToTemplates", null);
exports.FrontendManagerTemplateRendererManager = FrontendManagerTemplateRendererManager;
//# sourceMappingURL=template-renderer.js.map