"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ImportCollection_collection;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportCollection = void 0;
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
const typescript_1 = __importDefault(require("typescript"));
const path_1 = __importDefault(require("path"));
class ImportCollection {
    constructor() {
        _ImportCollection_collection.set(this, new Map());
    }
    addImport(packageName, importName) {
        if (!__classPrivateFieldGet(this, _ImportCollection_collection, "f").has(packageName)) {
            __classPrivateFieldGet(this, _ImportCollection_collection, "f").set(packageName, new Set());
        }
        const existingPackage = __classPrivateFieldGet(this, _ImportCollection_collection, "f").get(packageName);
        if (!(existingPackage === null || existingPackage === void 0 ? void 0 : existingPackage.has(importName))) {
            existingPackage === null || existingPackage === void 0 ? void 0 : existingPackage.add(importName);
        }
    }
    mergeCollections(otherCollection) {
        for (const [key, value] of __classPrivateFieldGet(otherCollection, _ImportCollection_collection, "f")) {
            [...value].forEach((singlePackage) => {
                this.addImport(key, singlePackage);
            });
        }
    }
    buildSampleSnippetImports(topComponentName) {
        return [
            typescript_1.default.createImportDeclaration(undefined, undefined, typescript_1.default.createImportClause(undefined, typescript_1.default.createNamedImports([
                typescript_1.default.createImportSpecifier(undefined, typescript_1.default.createIdentifier(topComponentName)),
            ])), typescript_1.default.createStringLiteral('./ui-components')),
        ];
    }
    buildImportStatements(skipReactImport) {
        const importDeclarations = []
            .concat(skipReactImport
            ? []
            : [
                typescript_1.default.createImportDeclaration(undefined, undefined, typescript_1.default.createImportClause(typescript_1.default.createIdentifier('React'), undefined), typescript_1.default.createStringLiteral('react')),
            ])
            .concat(Array.from(__classPrivateFieldGet(this, _ImportCollection_collection, "f")).map(([moduleName, imports]) => {
            const namedImports = [...imports].filter((namedImport) => namedImport !== 'default').sort();
            return typescript_1.default.createImportDeclaration(undefined, undefined, typescript_1.default.createImportClause(
            // use module name as defualt import name
            [...imports].indexOf('default') >= 0 ? typescript_1.default.createIdentifier(path_1.default.basename(moduleName)) : undefined, typescript_1.default.createNamedImports(namedImports.map((item) => {
                return typescript_1.default.createImportSpecifier(undefined, typescript_1.default.createIdentifier(item));
            }))), typescript_1.default.createStringLiteral(moduleName));
        }));
        return importDeclarations;
    }
}
exports.ImportCollection = ImportCollection;
_ImportCollection_collection = new WeakMap();
//# sourceMappingURL=import-collection.js.map