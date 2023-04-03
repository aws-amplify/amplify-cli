"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateState = exports.getTableNames = exports.getPreviousDeploymentRecord = void 0;
const lodash_1 = __importDefault(require("lodash"));
const amplify_cli_core_1 = require("amplify-cli-core");
const getPreviousDeploymentRecord = async (cfnClient, stackId) => {
    const depRecord = {};
    const apiStackInfo = await cfnClient
        .describeStacks({
        StackName: stackId,
    })
        .promise();
    depRecord.parameters = apiStackInfo.Stacks[0].Parameters.reduce((acc, param) => {
        acc[param.ParameterKey] = param.ParameterValue;
        return acc;
    }, {});
    depRecord.capabilities = apiStackInfo.Stacks[0].Capabilities;
    return depRecord;
};
exports.getPreviousDeploymentRecord = getPreviousDeploymentRecord;
const getTableNames = async (cfnClient, tables, StackId) => {
    const tableNameMap = new Map();
    const apiResources = await cfnClient
        .describeStackResources({
        StackName: StackId,
    })
        .promise();
    for (const resource of apiResources.StackResources) {
        if (tables.includes(resource.LogicalResourceId)) {
            const tableStack = await cfnClient
                .describeStacks({
                StackName: resource.PhysicalResourceId,
            })
                .promise();
            const tableName = tableStack.Stacks[0].Outputs.reduce((acc, out) => {
                if (out.OutputKey === `GetAtt${resource.LogicalResourceId}TableName`) {
                    acc.push(out.OutputValue);
                }
                return acc;
            }, []);
            tableNameMap.set(resource.LogicalResourceId, tableName[0]);
        }
    }
    return tableNameMap;
};
exports.getTableNames = getTableNames;
class TemplateState {
    constructor() {
        this.changes = {};
    }
    has(key) {
        return Boolean(key in this.changes);
    }
    isEmpty() {
        return !Object.keys(this.changes).length;
    }
    get(key) {
        return this.changes[key];
    }
    getLatest(key) {
        if (this.changes[key]) {
            const length = this.changes[key].length;
            return length ? amplify_cli_core_1.JSONUtilities.parse(this.changes[key][length - 1]) : null;
        }
        return null;
    }
    pop(key) {
        const template = this.changes[key].shift();
        if (lodash_1.default.isEmpty(this.changes[key])) {
            delete this.changes[key];
        }
        return amplify_cli_core_1.JSONUtilities.parse(template);
    }
    add(key, val) {
        if (!(key in this.changes)) {
            this.changes[key] = [];
        }
        this.changes[key].push(val);
    }
    getChangeCount(key) {
        return this.changes[key].length;
    }
    getKeys() {
        return Object.keys(this.changes);
    }
}
exports.TemplateState = TemplateState;
//# sourceMappingURL=amplify-resource-state-utils.js.map