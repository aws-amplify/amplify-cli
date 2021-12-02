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
const import_collection_1 = require("../import-collection");
const snapshot_helpers_1 = require("./__utils__/snapshot-helpers");
function assertImportCollectionMatchesSnapshot(importCollection) {
    (0, snapshot_helpers_1.assertASTMatchesSnapshot)(importCollection.buildImportStatements());
}
describe('ImportCollection', () => {
    describe('buildImportStatements', () => {
        test('no imports', () => {
            const importCollection = new import_collection_1.ImportCollection();
            assertImportCollectionMatchesSnapshot(importCollection);
        });
        test('multiple imports', () => {
            const importCollection = new import_collection_1.ImportCollection();
            importCollection.addImport('@aws-amplify/ui-react', 'Button');
            importCollection.addImport('@aws-amplify/ui-react', 'getOverrideProps');
            importCollection.addImport('../models', 'User');
            assertImportCollectionMatchesSnapshot(importCollection);
        });
    });
    describe('addImport', () => {
        test('one import', () => {
            const importCollection = new import_collection_1.ImportCollection();
            importCollection.addImport('@aws-amplify/ui-react', 'Text');
            assertImportCollectionMatchesSnapshot(importCollection);
        });
        test('one relative import', () => {
            const importCollection = new import_collection_1.ImportCollection();
            importCollection.addImport('../models', 'User');
            assertImportCollectionMatchesSnapshot(importCollection);
        });
        test('multiple imports', () => {
            const importCollection = new import_collection_1.ImportCollection();
            importCollection.addImport('@aws-amplify/ui-react', 'Text');
            importCollection.addImport('../models', 'User');
            assertImportCollectionMatchesSnapshot(importCollection);
        });
        test('multiple identical imports', () => {
            const importCollection = new import_collection_1.ImportCollection();
            importCollection.addImport('@aws-amplify/ui-react', 'Text');
            importCollection.addImport('@aws-amplify/ui-react', 'Text');
            assertImportCollectionMatchesSnapshot(importCollection);
        });
        test('multiple imports from the same package', () => {
            const importCollection = new import_collection_1.ImportCollection();
            importCollection.addImport('@aws-amplify/ui-react', 'Text');
            importCollection.addImport('@aws-amplify/ui-react', 'getOverrideProps');
            assertImportCollectionMatchesSnapshot(importCollection);
        });
    });
    test('mergeCollections', () => {
        const collectionA = new import_collection_1.ImportCollection();
        const collectionB = new import_collection_1.ImportCollection();
        collectionA.addImport('@aws-amplify/ui-react', 'Text');
        collectionA.addImport('@aws-amplify/ui-react', 'getOverrideProps');
        collectionA.addImport('../models', 'User');
        collectionB.addImport('@aws-amplify/ui-react', 'Button');
        collectionB.addImport('../models', 'User');
        collectionA.mergeCollections(collectionB);
        assertImportCollectionMatchesSnapshot(collectionA);
    });
    test('buildSampleSnippetImports', () => {
        const importCollection = new import_collection_1.ImportCollection();
        (0, snapshot_helpers_1.assertASTMatchesSnapshot)(importCollection.buildSampleSnippetImports('MyButton'));
    });
});
//# sourceMappingURL=import-collection.test.js.map