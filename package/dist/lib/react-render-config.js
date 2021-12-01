"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scriptKindToFileExtensionNonReact = exports.scriptKindToFileExtension = exports.ModuleKind = exports.ScriptTarget = exports.ScriptKind = void 0;
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
const typescript_1 = require("typescript");
var typescript_2 = require("typescript");
Object.defineProperty(exports, "ScriptKind", { enumerable: true, get: function () { return typescript_2.ScriptKind; } });
Object.defineProperty(exports, "ScriptTarget", { enumerable: true, get: function () { return typescript_2.ScriptTarget; } });
Object.defineProperty(exports, "ModuleKind", { enumerable: true, get: function () { return typescript_2.ModuleKind; } });
function scriptKindToFileExtension(scriptKind) {
    switch (scriptKind) {
        case typescript_1.ScriptKind.TSX:
            return 'tsx';
        case typescript_1.ScriptKind.JS:
            return 'js';
        case typescript_1.ScriptKind.JSX:
            return 'jsx';
        default:
            throw new codegen_ui_1.InvalidInputError(`Invalid script kind: ${typescript_1.ScriptKind[scriptKind]}`);
    }
}
exports.scriptKindToFileExtension = scriptKindToFileExtension;
function scriptKindToFileExtensionNonReact(scriptKind) {
    switch (scriptKind) {
        case typescript_1.ScriptKind.TSX:
            return 'ts';
        case typescript_1.ScriptKind.JS:
        case typescript_1.ScriptKind.JSX:
            return 'js';
        default:
            throw new codegen_ui_1.InvalidInputError(`Invalid script kind: ${typescript_1.ScriptKind[scriptKind]}`);
    }
}
exports.scriptKindToFileExtensionNonReact = scriptKindToFileExtensionNonReact;
//# sourceMappingURL=react-render-config.js.map