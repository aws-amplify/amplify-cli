"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBService = exports.createDynamoDBService = void 0;
const dynamodb_1 = __importDefault(require("aws-sdk/clients/dynamodb"));
const configuration_manager_1 = require("../configuration-manager");
const paged_call_1 = require("./paged-call");
const createDynamoDBService = async (context, options) => {
    let credentials = {};
    try {
        credentials = await (0, configuration_manager_1.loadConfiguration)(context);
    }
    catch (e) {
    }
    const dynamoDB = new dynamodb_1.default({ ...credentials, ...options });
    return new DynamoDBService(dynamoDB);
};
exports.createDynamoDBService = createDynamoDBService;
class DynamoDBService {
    constructor(dynamoDB) {
        this.dynamoDB = dynamoDB;
        this.cachedTableList = [];
    }
    async listTables() {
        if (this.cachedTableList.length === 0) {
            const result = await (0, paged_call_1.pagedAWSCall)(async (params, nextToken) => {
                return await this.dynamoDB
                    .listTables({
                    ...params,
                    ExclusiveStartTableName: nextToken,
                })
                    .promise();
            }, {
                Limit: 100,
            }, (response) => response === null || response === void 0 ? void 0 : response.TableNames, async (response) => response === null || response === void 0 ? void 0 : response.LastEvaluatedTableName);
            this.cachedTableList.push(...result);
        }
        return this.cachedTableList;
    }
    async getTableDetails(tableName) {
        const response = await this.dynamoDB
            .describeTable({
            TableName: tableName,
        })
            .promise();
        return response.Table;
    }
    async tableExists(tableName) {
        const tables = await this.listTables();
        return tables.includes(tableName);
    }
}
exports.DynamoDBService = DynamoDBService;
//# sourceMappingURL=DynamoDBService.js.map