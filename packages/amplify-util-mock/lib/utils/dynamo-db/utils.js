"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpdateTableInput = exports.describeTables = exports.updateTables = exports.createTables = void 0;
const lodash_1 = __importDefault(require("lodash"));
const helpers_1 = require("./helpers");
async function createTables(dynamoDbClient, tables) {
    for (const table of tables) {
        console.log(`Creating new table ${table.TableName}`);
        await dynamoDbClient.createTable(table).promise();
    }
}
exports.createTables = createTables;
async function updateTables(dynamoDbClient, tables) {
    for (const table of tables) {
        const updateType = table.GlobalSecondaryIndexUpdates[0].Delete ? 'Deleting' : 'Creating';
        const indexName = updateType == 'Deleting'
            ? table.GlobalSecondaryIndexUpdates[0].Delete.IndexName
            : table.GlobalSecondaryIndexUpdates[0].Create.IndexName;
        await (0, helpers_1.waitTillTableStateIsActive)(dynamoDbClient, table.TableName);
        console.log(`${updateType} index ${indexName} on ${table.TableName}`);
        await dynamoDbClient.updateTable(table).promise();
    }
}
exports.updateTables = updateTables;
async function describeTables(dynamoDbClient, tableNames) {
    const tableDetails = {};
    if (lodash_1.default.isEmpty(tableNames)) {
        return tableDetails;
    }
    for (const tableName of tableNames) {
        const tableDescription = await dynamoDbClient.describeTable({ TableName: tableName }).promise();
        if (tableDescription.Table) {
            tableDetails[tableName] = tableDescription.Table;
        }
    }
    return tableDetails;
}
exports.describeTables = describeTables;
function getUpdateTableInput(createInput, existingTableConfig) {
    if (createInput.TableName !== existingTableConfig.TableName) {
        throw new Error('Invalid input, table name mismatch');
    }
    const inputGSINames = (createInput.GlobalSecondaryIndexes || []).map((index) => index.IndexName);
    const existingGSINames = (existingTableConfig.GlobalSecondaryIndexes || []).map((index) => index.IndexName);
    const indexNamesToAdd = inputGSINames.filter((indexName) => !existingGSINames.includes(indexName));
    const indexNamesToRemove = existingGSINames.filter((indexName) => !inputGSINames.includes(indexName));
    const indicesToAdd = indexNamesToAdd.map((indexName) => {
        const idx = createInput.GlobalSecondaryIndexes.find((index) => index.IndexName === indexName);
        return {
            Create: idx,
        };
    });
    const indicesToRemove = indexNamesToRemove.map((indexName) => {
        return {
            Delete: {
                IndexName: indexName,
            },
        };
    });
    return [
        ...(indicesToRemove.length
            ? indicesToRemove.map((index) => {
                return {
                    TableName: existingTableConfig.TableName,
                    GlobalSecondaryIndexUpdates: [index],
                };
            })
            : []),
        ...(indicesToAdd.length
            ? indicesToAdd.map((index) => {
                return {
                    TableName: existingTableConfig.TableName,
                    AttributeDefinitions: createInput.AttributeDefinitions,
                    GlobalSecondaryIndexUpdates: [index],
                };
            })
            : []),
    ];
}
exports.getUpdateTableInput = getUpdateTableInput;
//# sourceMappingURL=utils.js.map