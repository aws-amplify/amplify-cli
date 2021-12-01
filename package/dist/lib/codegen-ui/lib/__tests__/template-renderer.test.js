"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const utils_1 = require("ts-jest/utils"); // eslint-disable-line import/no-extraneous-dependencies
const fs_1 = require("fs");
const template_renderer_factory_1 = require("../template-renderer-factory");
const template_renderer_1 = require("../template-renderer");
const mock_classes_1 = require("./__utils__/mock-classes");
jest.mock('fs');
describe('FrontendManagerTemplateRendererManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('constructor - outputPathDir does not exist', () => {
        const outputPathDir = 'mock-output';
        const outputManager = new mock_classes_1.MockOutputManager();
        const rendererFactory = new template_renderer_factory_1.FrontendManagerTemplateRendererFactory((component) => new mock_classes_1.MockTemplateRenderer(component, outputManager, {}));
        (0, utils_1.mocked)(fs_1.existsSync).mockImplementation(() => false);
        new template_renderer_1.FrontendManagerTemplateRendererManager(rendererFactory, { outputPathDir }); // eslint-disable-line no-new
        expect(fs_1.existsSync).toHaveBeenCalled();
        expect(fs_1.mkdirSync).toHaveBeenCalledWith(outputPathDir);
    });
    test('constructor - outputPathDir does exist', () => {
        const outputPathDir = 'mock-output';
        const outputManager = new mock_classes_1.MockOutputManager();
        const rendererFactory = new template_renderer_factory_1.FrontendManagerTemplateRendererFactory((component) => new mock_classes_1.MockTemplateRenderer(component, outputManager, {}));
        (0, utils_1.mocked)(fs_1.existsSync).mockImplementation(() => true);
        new template_renderer_1.FrontendManagerTemplateRendererManager(rendererFactory, { outputPathDir }); // eslint-disable-line no-new
        expect(fs_1.existsSync).toHaveBeenCalled();
        expect(fs_1.mkdirSync).not.toHaveBeenCalled();
    });
    describe('renderSchemaToTemplate', () => {
        test('render component', () => {
            const outputPathDir = 'mock-output';
            const outputManager = new mock_classes_1.MockOutputManager();
            const rendererFactory = new template_renderer_factory_1.FrontendManagerTemplateRendererFactory((component) => new mock_classes_1.MockTemplateRenderer(component, outputManager, {}));
            const rendererManager = new template_renderer_1.FrontendManagerTemplateRendererManager(rendererFactory, { outputPathDir });
            const component = {
                componentType: 'Text',
                name: 'MyText',
                properties: {},
                bindingProperties: {},
            };
            const result = rendererManager.renderSchemaToTemplate(component);
            expect(result).toMatchSnapshot();
            expect(result.renderComponentToFilesystem).toHaveBeenCalledWith(outputPathDir);
        });
        test('throw error when component is not defined', () => {
            const outputPathDir = 'mock-output';
            const outputManager = new mock_classes_1.MockOutputManager();
            const rendererFactory = new template_renderer_factory_1.FrontendManagerTemplateRendererFactory((component) => new mock_classes_1.MockTemplateRenderer(component, outputManager, {}));
            const rendererManager = new template_renderer_1.FrontendManagerTemplateRendererManager(rendererFactory, { outputPathDir });
            expect(() => rendererManager.renderSchemaToTemplate(undefined)).toThrowErrorMatchingSnapshot();
        });
    });
    describe('renderSchemaToTemplates', () => {
        test('render components', () => {
            const outputPathDir = 'mock-output';
            const outputManager = new mock_classes_1.MockOutputManager();
            const mockRender = jest.fn((component) => new mock_classes_1.MockTemplateRenderer(component, outputManager, {}));
            const rendererFactory = new template_renderer_factory_1.FrontendManagerTemplateRendererFactory(mockRender);
            const rendererManager = new template_renderer_1.FrontendManagerTemplateRendererManager(rendererFactory, { outputPathDir });
            const component = {
                componentType: 'Text',
                name: 'MyText',
                properties: {},
                bindingProperties: {},
            };
            rendererManager.renderSchemaToTemplates([component]);
            expect(mockRender).toHaveBeenCalledWith(component);
        });
        test('throw error when component is not defined', () => {
            const outputPathDir = 'mock-output';
            const outputManager = new mock_classes_1.MockOutputManager();
            const rendererFactory = new template_renderer_factory_1.FrontendManagerTemplateRendererFactory((component) => new mock_classes_1.MockTemplateRenderer(component, outputManager, {}));
            const rendererManager = new template_renderer_1.FrontendManagerTemplateRendererManager(rendererFactory, { outputPathDir });
            expect(() => rendererManager.renderSchemaToTemplates(undefined)).toThrowErrorMatchingSnapshot();
        });
    });
});
//# sourceMappingURL=template-renderer.test.js.map