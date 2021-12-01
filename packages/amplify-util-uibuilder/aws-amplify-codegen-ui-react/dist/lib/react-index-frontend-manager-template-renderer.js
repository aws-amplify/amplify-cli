"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactIndexFrontendManagerTemplateRenderer = void 0;
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
const os_1 = require("os");
const typescript_1 = require("typescript");
const codegen_ui_1 = require("./codegen-ui");
const react_render_config_1 = require("./react-render-config");
const import_collection_1 = require("./import-collection");
const react_output_manager_1 = require("./react-output-manager");
const react_frontend_manager_template_renderer_helper_1 = require("./react-frontend-manager-template-renderer-helper");
class ReactIndexFrontendManagerTemplateRenderer extends codegen_ui_1.FrontendManagerTemplateRenderer {
    constructor(schemas, renderConfig) {
        super(schemas, new react_output_manager_1.ReactOutputManager(), renderConfig);
        this.importCollection = new import_collection_1.ImportCollection();
        this.renderConfig = {
            ...react_frontend_manager_template_renderer_helper_1.defaultRenderConfig,
            ...renderConfig,
            renderTypeDeclarations: false, // Never render type declarations for index.js|ts file.
        };
        this.fileName = `index.${(0, react_render_config_1.scriptKindToFileExtensionNonReact)(this.renderConfig.script)}`;
    }
    renderComponentInternal() {
        const { printer, file } = (0, react_frontend_manager_template_renderer_helper_1.buildPrinter)(this.fileName, this.renderConfig);
        const exportStatements = this.buildExports()
            .map((exportStatement) => printer.printNode(typescript_1.EmitHint.Unspecified, exportStatement, file))
            .join(os_1.EOL);
        const { componentText, declaration } = (0, react_frontend_manager_template_renderer_helper_1.transpile)(exportStatements, this.renderConfig);
        return {
            componentText,
            renderComponentToFilesystem: async (outputPath) => {
                await this.renderComponentToFilesystem(componentText)(this.fileName)(outputPath);
                if (declaration) {
                    await this.renderComponentToFilesystem(declaration)((0, react_frontend_manager_template_renderer_helper_1.getDeclarationFilename)(this.fileName))(outputPath);
                }
            },
        };
    }
    /*
     * export { default as MyTheme } from './MyTheme';
     * export { default as ButtonComponent } from './ButtonComponent';
     */
    buildExports() {
        return this.component
            .filter(({ name }) => name !== undefined)
            .map(({ name }) => {
            /**
             * Type checker isn't detecting that name can't be undefined here
             * including this (and return cast) to appease the checker.
             */
            if (name === undefined) {
                return undefined;
            }
            return typescript_1.factory.createExportDeclaration(undefined, undefined, false, typescript_1.factory.createNamedExports([
                typescript_1.factory.createExportSpecifier(typescript_1.factory.createIdentifier('default'), typescript_1.factory.createIdentifier(name)),
            ]), typescript_1.factory.createStringLiteral(`./${name}`));
        });
    }
}
exports.ReactIndexFrontendManagerTemplateRenderer = ReactIndexFrontendManagerTemplateRenderer;
//# sourceMappingURL=react-index-frontend-manager-template-renderer.js.map