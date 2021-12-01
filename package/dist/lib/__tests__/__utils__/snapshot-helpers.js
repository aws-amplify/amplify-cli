"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertASTMatchesSnapshot = void 0;
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
// render typescript AST to typescript then expect to match snapshot
function assertASTMatchesSnapshot(ast) {
    const file = (0, typescript_1.createSourceFile)('test.ts', '', typescript_1.ScriptTarget.ES2015, true, typescript_1.ScriptKind.TS);
    const printer = (0, typescript_1.createPrinter)();
    if (Array.isArray(ast)) {
        expect(ast.map((singleAST) => printer.printNode(typescript_1.EmitHint.Unspecified, singleAST, file)).join('\n')).toMatchSnapshot();
    }
    else {
        expect(printer.printNode(typescript_1.EmitHint.Unspecified, ast, file)).toMatchSnapshot();
    }
}
exports.assertASTMatchesSnapshot = assertASTMatchesSnapshot;
//# sourceMappingURL=snapshot-helpers.js.map