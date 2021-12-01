"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindingPropertyUsesHook = exports.jsonToLiteral = exports.getDeclarationFilename = exports.buildPrinter = exports.transpile = exports.defaultRenderConfig = void 0;
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
const codegen_ui_1 = require("./codegen-ui");
const typescript_1 = __importStar(require("typescript"));
const prettier_1 = __importDefault(require("prettier"));
const parser_typescript_1 = __importDefault(require("prettier/parser-typescript"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const temp_1 = __importDefault(require("temp"));
const react_render_config_1 = require("./react-render-config");
exports.defaultRenderConfig = {
    script: react_render_config_1.ScriptKind.TSX,
    target: react_render_config_1.ScriptTarget.ES2015,
    module: react_render_config_1.ModuleKind.ESNext,
};
function transpile(code, renderConfig) {
    const { target, module, script, renderTypeDeclarations } = renderConfig;
    if (script === react_render_config_1.ScriptKind.JS || script === react_render_config_1.ScriptKind.JSX) {
        const transpiledCode = (0, typescript_1.transpileModule)(code, {
            compilerOptions: {
                target,
                module,
                jsx: script === react_render_config_1.ScriptKind.JS ? typescript_1.default.JsxEmit.React : typescript_1.default.JsxEmit.Preserve,
                esModuleInterop: true,
            },
        }).outputText;
        const componentText = prettier_1.default.format(transpiledCode, { parser: 'typescript', plugins: [parser_typescript_1.default] });
        /* createProgram is less performant than traspileModule and should only be used when necessary.
         * createProgram is used here becuase transpileModule cannot produce type declarations.
         */
        if (renderTypeDeclarations) {
            temp_1.default.track(); // tracks temp resources created to then be deleted by temp.cleanupSync
            try {
                const tmpFile = temp_1.default.openSync({ suffix: '.tsx' });
                const tmpDir = temp_1.default.mkdirSync();
                fs_1.default.writeFileSync(tmpFile.path, code);
                (0, typescript_1.createProgram)([tmpFile.path], {
                    target,
                    module,
                    declaration: true,
                    emitDeclarationOnly: true,
                    outDir: tmpDir,
                    skipLibCheck: true,
                }).emit();
                const declaration = fs_1.default.readFileSync(path_1.default.join(tmpDir, getDeclarationFilename(tmpFile.path)), 'utf8');
                return { componentText, declaration };
            }
            finally {
                temp_1.default.cleanupSync();
            }
        }
        return {
            componentText,
        };
    }
    return { componentText: prettier_1.default.format(code, { parser: 'typescript', plugins: [parser_typescript_1.default] }) };
}
exports.transpile = transpile;
function buildPrinter(fileName, renderConfig) {
    const { target, script } = renderConfig;
    const file = (0, typescript_1.createSourceFile)(fileName, '', target || exports.defaultRenderConfig.target, false, script || exports.defaultRenderConfig.script);
    const printer = (0, typescript_1.createPrinter)({
        newLine: typescript_1.NewLineKind.LineFeed,
    });
    return { printer, file };
}
exports.buildPrinter = buildPrinter;
function getDeclarationFilename(filename) {
    return `${path_1.default.basename(filename, '.tsx')}.d.ts`;
}
exports.getDeclarationFilename = getDeclarationFilename;
// eslint-disable-next-line consistent-return
function jsonToLiteral(jsonObject) {
    if (jsonObject === null) {
        return typescript_1.factory.createNull();
    }
    // eslint-disable-next-line default-case
    switch (typeof jsonObject) {
        case 'string':
            return typescript_1.factory.createStringLiteral(jsonObject);
        case 'number':
            return typescript_1.factory.createNumericLiteral(jsonObject);
        case 'boolean': {
            if (jsonObject) {
                return typescript_1.factory.createTrue();
            }
            return typescript_1.factory.createFalse();
        }
        case 'object': {
            if (jsonObject instanceof Array) {
                return typescript_1.factory.createArrayLiteralExpression(jsonObject.map(jsonToLiteral), false);
            }
            // else object
            return typescript_1.factory.createObjectLiteralExpression(Object.entries(jsonObject).map(([key, value]) => typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral(key), jsonToLiteral(value))), false);
        }
    }
}
exports.jsonToLiteral = jsonToLiteral;
function bindingPropertyUsesHook(binding) {
    return (0, codegen_ui_1.isDataPropertyBinding)(binding) && 'predicate' in binding.bindingProperties;
}
exports.bindingPropertyUsesHook = bindingPropertyUsesHook;
//# sourceMappingURL=react-frontend-manager-template-renderer-helper.js.map