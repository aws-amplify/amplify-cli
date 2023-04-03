"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExistingIndexNames = exports.assertNotIntrinsicFunction = exports.removeGSI = exports.addGSI = exports.getGSIDetails = exports.MAX_GSI_PER_TABLE = void 0;
const cloudform_1 = require("cloudform");
const lodash_1 = __importDefault(require("lodash"));
const amplify_cli_core_1 = require("amplify-cli-core");
exports.MAX_GSI_PER_TABLE = 20;
const getGSIDetails = (indexName, table) => {
    var _a;
    const gsis = (_a = table.Properties.GlobalSecondaryIndexes) !== null && _a !== void 0 ? _a : [];
    assertNotIntrinsicFunction(gsis);
    const indexItems = lodash_1.default.filter(gsis, {
        IndexName: indexName,
    });
    if (indexItems.length) {
        const addedGSI = indexItems[0];
        const keySchema = addedGSI.KeySchema;
        assertNotIntrinsicFunction(keySchema);
        const attributesUsedInKey = keySchema.reduce((acc, attr) => {
            acc.push(attr.AttributeName);
            return acc;
        }, []);
        const existingAttrDefinition = table.Properties.AttributeDefinitions;
        assertNotIntrinsicFunction(existingAttrDefinition);
        const attributeDefinition = lodash_1.default.filter(existingAttrDefinition, (defs) => attributesUsedInKey.includes(defs.AttributeName));
        return { gsi: addedGSI, attributeDefinition };
    }
    return undefined;
};
exports.getGSIDetails = getGSIDetails;
const addGSI = (index, table) => {
    var _a, _b;
    const updatedTable = lodash_1.default.cloneDeep(table);
    const gsis = (_a = updatedTable.Properties.GlobalSecondaryIndexes) !== null && _a !== void 0 ? _a : [];
    assertNotIntrinsicFunction(gsis);
    const existingIndices = (0, exports.getExistingIndexNames)(table);
    if (existingIndices.length + 1 > exports.MAX_GSI_PER_TABLE) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: `DynamoDB ${table.Properties.TableName || '{UnNamedTable}'} can have max of ${exports.MAX_GSI_PER_TABLE} GSIs`,
        });
    }
    const indexName = index.gsi.IndexName;
    assertNotIntrinsicFunction(indexName);
    if (existingIndices.includes(indexName)) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: `An index with name ${indexName} already exists`,
        });
    }
    gsis.push(index.gsi);
    updatedTable.Properties.GlobalSecondaryIndexes = gsis;
    const attrDefs = ((_b = updatedTable.Properties.AttributeDefinitions) !== null && _b !== void 0 ? _b : []);
    updatedTable.Properties.AttributeDefinitions = lodash_1.default.unionBy(attrDefs, index.attributeDefinition, 'AttributeName');
    return updatedTable;
};
exports.addGSI = addGSI;
const removeGSI = (indexName, table) => {
    var _a;
    const updatedTable = lodash_1.default.cloneDeep(table);
    const gsis = updatedTable.Properties.GlobalSecondaryIndexes;
    assertNotIntrinsicFunction(gsis);
    if (!gsis || gsis.length === 0) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: `No GSIs are present in the table`,
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    const indexNames = gsis.map((g) => g.IndexName);
    if (!indexNames.includes(indexName)) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: `Table ${table.Properties.TableName || '{UnnamedTable}'} does not contain GSI ${indexName}`,
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    const attrDefs = updatedTable.Properties.AttributeDefinitions;
    assertNotIntrinsicFunction(attrDefs);
    const removedIndices = lodash_1.default.remove(gsis, { IndexName: indexName });
    assertNotIntrinsicFunction(removedIndices);
    const gsiKeySchemas = gsis.reduce((acc, gsi) => {
        acc.push(...gsi.KeySchema);
        return acc;
    }, []);
    const currentKeySchemas = lodash_1.default.union(gsiKeySchemas, ((_a = updatedTable === null || updatedTable === void 0 ? void 0 : updatedTable.Properties) === null || _a === void 0 ? void 0 : _a.KeySchema) || []);
    if (gsis.length == 0) {
        delete updatedTable.Properties.GlobalSecondaryIndexes;
    }
    if (removedIndices === null || removedIndices === void 0 ? void 0 : removedIndices.length) {
        const removedIndex = removedIndices[0];
        const removedKeySchema = removedIndex.KeySchema;
        assertNotIntrinsicFunction(removedKeySchema);
        const attrToRemove = lodash_1.default.differenceBy(removedKeySchema, currentKeySchemas, 'AttributeName');
        lodash_1.default.pullAllBy(attrDefs, attrToRemove, 'AttributeName');
    }
    return updatedTable;
};
exports.removeGSI = removeGSI;
function assertNotIntrinsicFunction(x) {
    if (x instanceof cloudform_1.IntrinsicFunction) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: 'Intrinsic functions are not supported in KeySchema and GlobalSecondaryIndex',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
}
exports.assertNotIntrinsicFunction = assertNotIntrinsicFunction;
const getExistingIndexNames = (table) => {
    var _a;
    const gsis = (_a = table.Properties.GlobalSecondaryIndexes) !== null && _a !== void 0 ? _a : [];
    assertNotIntrinsicFunction(gsis);
    return gsis.reduce((acc, idx) => [...acc, idx.IndexName], []);
};
exports.getExistingIndexNames = getExistingIndexNames;
//# sourceMappingURL=dynamodb-gsi-helpers.js.map