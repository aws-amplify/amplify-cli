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
const typescript_1 = require("typescript");
const __1 = require("..");
const react_render_config_1 = require("../react-render-config");
describe('ReactRenderConfig', () => {
    describe('scriptKindToFileExtension', () => {
        test('JS', () => {
            expect((0, react_render_config_1.scriptKindToFileExtension)(typescript_1.ScriptKind.JS)).toEqual('js');
        });
        test('JSX', () => {
            expect((0, react_render_config_1.scriptKindToFileExtension)(typescript_1.ScriptKind.JSX)).toEqual('jsx');
        });
        test('TSX', () => {
            expect((0, react_render_config_1.scriptKindToFileExtension)(typescript_1.ScriptKind.TSX)).toEqual('tsx');
        });
        test('TS (not supported)', () => {
            expect(() => (0, react_render_config_1.scriptKindToFileExtension)(typescript_1.ScriptKind.TS)).toThrow(new Error('Invalid script kind: TS'));
        });
    });
    describe('scriptKindToFileExtensionNonReact', () => {
        test('JS', () => {
            expect((0, __1.scriptKindToFileExtensionNonReact)(typescript_1.ScriptKind.JS)).toEqual('js');
        });
        test('JSX', () => {
            expect((0, __1.scriptKindToFileExtensionNonReact)(typescript_1.ScriptKind.JSX)).toEqual('js');
        });
        test('TSX', () => {
            expect((0, __1.scriptKindToFileExtensionNonReact)(typescript_1.ScriptKind.TSX)).toEqual('ts');
        });
        test('TS (not supported)', () => {
            expect(() => (0, __1.scriptKindToFileExtensionNonReact)(typescript_1.ScriptKind.TS)).toThrow(new Error('Invalid script kind: TS'));
        });
    });
});
//# sourceMappingURL=react-render-config.test.js.map