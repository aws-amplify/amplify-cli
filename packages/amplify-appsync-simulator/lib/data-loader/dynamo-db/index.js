"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBDataLoader = void 0;
const aws_sdk_1 = require("aws-sdk");
const utils_1 = require("./utils");
class DynamoDBDataLoader {
    constructor(ddbConfig) {
        this.ddbConfig = ddbConfig;
        const { tableName, endpoint } = ddbConfig.config;
        if (!tableName || !endpoint) {
            throw new Error(`Invalid DynamoDBConfig ${JSON.stringify(ddbConfig, null, 4)}`);
        }
        this.tableName = tableName;
        this.client = new aws_sdk_1.DynamoDB({ ...ddbConfig.config, ...ddbConfig.options });
    }
    async load(payload) {
        try {
            switch (payload.operation) {
                case 'GetItem':
                    return await this.getItem(payload);
                case 'PutItem':
                    return await this.putItem(payload);
                case 'UpdateItem':
                    return await this.updateItem(payload);
                case 'DeleteItem':
                    return await this.deleteItem(payload);
                case 'Query':
                    return await this.query(payload);
                case 'Scan':
                    return await this.scan(payload);
                case 'DeleteAllItems':
                    return await this.deleteAllItems();
                case 'BatchGetItem':
                case 'BatchPutItem':
                case 'BatchDeleteItem':
                    throw new Error(`Operation  ${payload.operation} not implemented`);
                default:
                    throw new Error(`Unknown operation name: ${payload.operation}`);
            }
        }
        catch (e) {
            if (e.code) {
                console.log('Error while executing Local DynamoDB');
                console.log(JSON.stringify(payload, null, 4));
                console.log(e);
                e.extensions = { errorType: 'DynamoDB:' + e.code };
            }
            throw e;
        }
    }
    async deleteAllItems() {
        try {
            const items = await this.getAllItems();
            for await (const item of items) {
                await this.client
                    .deleteItem({
                    TableName: this.tableName,
                    Key: { id: item.id },
                    ReturnValues: 'ALL_OLD',
                })
                    .promise();
            }
        }
        catch (e) {
            throw new Error(`Error while deleting all items from ${this.tableName}`);
        }
        return [this.tableName];
    }
    async getAllItems() {
        let items = [];
        let data = await this.client.scan({ TableName: this.tableName }).promise();
        items = [...items, ...data.Items];
        while (typeof data.LastEvaluatedKey !== 'undefined') {
            data = await this.client
                .scan({
                TableName: this.tableName,
                ExclusiveStartKey: data.LastEvaluatedKey,
            })
                .promise();
            items = [...items, ...data.Items];
        }
        return items;
    }
    async getItem(payload) {
        const { consistentRead = false } = payload;
        const result = await this.client
            .getItem({
            TableName: this.tableName,
            Key: payload.key,
            ConsistentRead: consistentRead,
        })
            .promise();
        if (!result.Item)
            return null;
        return (0, utils_1.unmarshall)(result.Item);
    }
    async putItem(payload) {
        const { key, attributeValues, condition: { expression = null, expressionNames = null, expressionValues = null, } = {}, } = payload;
        await this.client
            .putItem({
            TableName: this.tableName,
            Item: {
                ...attributeValues,
                ...key,
            },
            ConditionExpression: expression,
            ExpressionAttributeNames: expressionNames,
            ExpressionAttributeValues: expressionValues,
        })
            .promise();
        return this.getItem({ key, consistentRead: true });
    }
    async query({ query: keyCondition, filter, index, nextToken, limit, scanIndexForward = true, consistentRead = false, select }) {
        keyCondition = keyCondition || { expression: null };
        filter = filter || { expression: null };
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: keyCondition.expression,
            FilterExpression: filter.expression,
            ExpressionAttributeValues: (0, utils_1.nullIfEmpty)({
                ...(filter.expressionValues || {}),
                ...(keyCondition.expressionValues || {}),
            }),
            ExpressionAttributeNames: (0, utils_1.nullIfEmpty)({
                ...(filter.expressionNames || {}),
                ...(keyCondition.expressionNames || {}),
            }),
            ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : null,
            IndexName: index,
            Limit: limit,
            ConsistentRead: consistentRead,
            ScanIndexForward: scanIndexForward,
            Select: select || 'ALL_ATTRIBUTES',
        };
        const { Items: items, ScannedCount: scannedCount, LastEvaluatedKey: resultNextToken = null, } = await this.client.query(params).promise();
        return {
            items: items.map((item) => (0, utils_1.unmarshall)(item)),
            scannedCount,
            nextToken: resultNextToken ? Buffer.from(JSON.stringify(resultNextToken)).toString('base64') : null,
        };
    }
    async updateItem(payload) {
        const { key, update = {}, condition = {} } = payload;
        const params = {
            TableName: this.tableName,
            Key: key,
            UpdateExpression: update.expression,
            ConditionExpression: condition.expression,
            ReturnValues: 'ALL_NEW',
            ExpressionAttributeNames: (0, utils_1.nullIfEmpty)({
                ...(condition.expressionNames || {}),
                ...(update.expressionNames || {}),
            }),
            ExpressionAttributeValues: (0, utils_1.nullIfEmpty)({
                ...(condition.expressionValues || {}),
                ...(update.expressionValues || {}),
            }),
        };
        const { Attributes: updated } = await this.client.updateItem(params).promise();
        return (0, utils_1.unmarshall)(updated);
    }
    async deleteItem(payload) {
        const { key, condition: { expression = null, expressionNames = null, expressionValues = null, } = {}, } = payload;
        const { Attributes: deleted } = await this.client
            .deleteItem({
            TableName: this.tableName,
            Key: key,
            ReturnValues: 'ALL_OLD',
            ConditionExpression: expression,
            ExpressionAttributeNames: expressionNames,
            ExpressionAttributeValues: expressionValues,
        })
            .promise();
        return (0, utils_1.unmarshall)(deleted);
    }
    async scan(payload) {
        const { filter, index, limit, consistentRead = false, nextToken, select, totalSegments, segment } = payload;
        const params = {
            TableName: this.tableName,
            ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : null,
            IndexName: index,
            Limit: limit,
            ConsistentRead: consistentRead,
            Select: select || 'ALL_ATTRIBUTES',
            Segment: segment,
            TotalSegments: totalSegments,
        };
        if (filter) {
            Object.assign(params, {
                FilterExpression: filter.expression,
                ExpressionAttributeNames: (0, utils_1.nullIfEmpty)({
                    ...(filter.expressionNames || undefined),
                }),
                ExpressionAttributeValues: {
                    ...(filter.expressionValues || undefined),
                },
            });
        }
        const { Items: items, ScannedCount: scannedCount, LastEvaluatedKey: resultNextToken = null } = await this.client.scan(params).promise();
        return {
            items: items.map((item) => (0, utils_1.unmarshall)(item)),
            scannedCount,
            nextToken: resultNextToken ? Buffer.from(JSON.stringify(resultNextToken)).toString('base64') : null,
        };
    }
}
exports.DynamoDBDataLoader = DynamoDBDataLoader;
//# sourceMappingURL=index.js.map