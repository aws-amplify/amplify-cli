"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactThemeFrontendManagerTemplateRenderer = void 0;
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
class ReactThemeFrontendManagerTemplateRenderer extends codegen_ui_1.FrontendManagerTemplateRenderer {
    constructor(theme, renderConfig) {
        super(theme, new react_output_manager_1.ReactOutputManager(), renderConfig);
        this.importCollection = new import_collection_1.ImportCollection();
        (0, codegen_ui_1.validateThemeSchema)(theme);
        this.renderConfig = {
            ...react_frontend_manager_template_renderer_helper_1.defaultRenderConfig,
            ...renderConfig,
        };
        this.fileName = `${this.component.name}.${(0, react_render_config_1.scriptKindToFileExtensionNonReact)(this.renderConfig.script)}`;
    }
    renderComponentInternal() {
        const { printer, file } = (0, react_frontend_manager_template_renderer_helper_1.buildPrinter)(this.fileName, this.renderConfig);
        const renderedImports = this.buildImports().map((importStatement) => printer.printNode(typescript_1.EmitHint.Unspecified, importStatement, file));
        const renderedFunction = printer.printNode(typescript_1.EmitHint.Unspecified, this.buildTheme(), file);
        const componentText = ['/* eslint-disable */', ...renderedImports, renderedFunction].join(os_1.EOL);
        const { componentText: transpiledComponentText, declaration } = (0, react_frontend_manager_template_renderer_helper_1.transpile)(componentText, this.renderConfig);
        return {
            componentText: transpiledComponentText,
            renderComponentToFilesystem: async (outputPath) => {
                await this.renderComponentToFilesystem(transpiledComponentText)(this.fileName)(outputPath);
                if (declaration) {
                    await this.renderComponentToFilesystem(declaration)((0, react_frontend_manager_template_renderer_helper_1.getDeclarationFilename)(this.fileName))(outputPath);
                }
            },
        };
    }
    /*
     * import { createTheme } from "@aws-amplify/ui-react";
     */
    buildImports() {
        this.importCollection.addImport('@aws-amplify/ui-react', 'createTheme');
        return this.importCollection.buildImportStatements(true);
    }
    /*
     * export default createTheme({ ... });
     */
    buildTheme() {
        return typescript_1.factory.createExportAssignment(undefined, undefined, undefined, typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier('createTheme'), undefined, [this.buildThemeObject()]));
    }
    /*
     * {
     *   id: '123',
     *   name: 'MyTheme',
     *   tokens: {},
     *   overrides: {},
     * }
     */
    buildThemeObject() {
        return typescript_1.factory.createObjectLiteralExpression([
            typescript_1.factory.createPropertyAssignment(typescript_1.factory.createIdentifier('name'), typescript_1.factory.createStringLiteral(this.component.name)),
        ]
            .concat(this.buildThemeValues(this.component.values))
            .concat(this.buildThemeOverrides(this.component.overrides)), true);
    }
    /* Removes children and value (needed for smithy) from theme values json
     *
     * tokens: {
     *   components: {
     *     alert: {
     *       backgroundcolor: \\"hsl(210, 5%, 90%)\\",
     * ...
     */
    buildThemeValues(values) {
        return values.map(({ key, value }) => typescript_1.factory.createPropertyAssignment(typescript_1.factory.createIdentifier(key), this.buildThemeValue(value)));
    }
    buildThemeValue(themeValue) {
        const { children, value } = themeValue;
        if (children) {
            return typescript_1.factory.createObjectLiteralExpression(this.buildThemeValues(children));
        }
        if (value) {
            return typescript_1.factory.createStringLiteral(value);
        }
        throw new codegen_ui_1.InvalidInputError(`Invalid theme value: ${JSON.stringify(value)}`);
    }
    /* builds special case theme value overrides becuase it is an array
     *
     * overrides: [
     *   {
     *     colorMode: \\"dark\\",
     *     tokens: {
     *       colors: { black: { value: \\"#fff\\" }, white: { value: \\"#000\\" } },
     *     },
     *   },
     * ],
     */
    buildThemeOverrides(overrides) {
        if (overrides === undefined) {
            return [];
        }
        return typescript_1.factory.createPropertyAssignment(typescript_1.factory.createIdentifier('overrides'), typescript_1.factory.createArrayLiteralExpression([typescript_1.factory.createObjectLiteralExpression(this.buildThemeValues(overrides), true)], false));
    }
}
exports.ReactThemeFrontendManagerTemplateRenderer = ReactThemeFrontendManagerTemplateRenderer;
//# sourceMappingURL=react-theme-frontend-manager-template-renderer.js.map