"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyDDBResourceStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ddb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'DDB Resource for AWS Amplify CLI';
class AmplifyDDBResourceStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, undefined);
        this._cfnParameterMap = new Map();
        this.generateStackResources = async () => {
            const usedAttributes = [];
            const keySchema = [];
            const globalSecondaryIndexes = [];
            if (this._props.partitionKey) {
                usedAttributes.push(this._props.partitionKey);
                keySchema.push({
                    attributeName: this._props.partitionKey.fieldName,
                    keyType: 'HASH',
                });
            }
            if (this._props.sortKey) {
                usedAttributes.push(this._props.sortKey);
                keySchema.push({
                    attributeName: this._props.sortKey.fieldName,
                    keyType: 'RANGE',
                });
            }
            if (this._props.gsi && this._props.gsi.length > 0) {
                this._props.gsi.forEach((gsi) => {
                    var _a;
                    const gsiIndex = {
                        indexName: gsi.name,
                        keySchema: [
                            {
                                attributeName: gsi.partitionKey.fieldName,
                                keyType: 'HASH',
                            },
                        ],
                        projection: {
                            projectionType: 'ALL',
                        },
                        provisionedThroughput: {
                            readCapacityUnits: 5,
                            writeCapacityUnits: 5,
                        },
                    };
                    if (usedAttributes.findIndex((attr) => attr.fieldName === gsi.partitionKey.fieldName) === -1) {
                        usedAttributes.push(gsi.partitionKey);
                    }
                    if (gsi.sortKey) {
                        gsiIndex.keySchema.push({
                            attributeName: (_a = gsi.sortKey) === null || _a === void 0 ? void 0 : _a.fieldName,
                            keyType: 'RANGE',
                        });
                        if (usedAttributes.findIndex((attr) => { var _a; return (attr === null || attr === void 0 ? void 0 : attr.fieldName) === ((_a = gsi.sortKey) === null || _a === void 0 ? void 0 : _a.fieldName); }) === -1) {
                            usedAttributes.push(gsi.sortKey);
                        }
                    }
                    globalSecondaryIndexes.push(gsiIndex);
                });
            }
            const ddbAttrTypeMapping = {
                string: 'S',
                number: 'N',
                binary: 'B',
                boolean: 'BOOL',
                list: 'L',
                map: 'M',
                null: 'NULL',
                'string-set': 'SS',
                'number-set': 'NS',
                'binary-set': 'BS',
            };
            const attributeMapping = [];
            usedAttributes.forEach((attr) => {
                attributeMapping.push({
                    attributeName: attr.fieldName,
                    attributeType: ddbAttrTypeMapping[attr.fieldType],
                });
            });
            this.dynamoDBTable = new ddb.CfnTable(this, 'DynamoDBTable', {
                tableName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', cdk.Fn.ref('tableName'), cdk.Fn.join('', [cdk.Fn.ref('tableName'), '-', cdk.Fn.ref('env')])).toString(),
                attributeDefinitions: attributeMapping,
                keySchema,
                globalSecondaryIndexes,
                provisionedThroughput: {
                    readCapacityUnits: 5,
                    writeCapacityUnits: 5,
                },
                streamSpecification: {
                    streamViewType: 'NEW_IMAGE',
                },
            });
        };
        this.renderCloudFormationTemplate = () => JSON.stringify(this._toCloudFormation(), undefined, 2);
        this._scope = scope;
        this._props = props;
        this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
        this.templateOptions.description = ROOT_CFN_DESCRIPTION;
    }
    addCfnOutput(props, logicalId) {
        try {
            new cdk.CfnOutput(this, logicalId, props);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    addCfnMapping(props, logicalId) {
        try {
            new cdk.CfnMapping(this, logicalId, props);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    addCfnCondition(props, logicalId) {
        try {
            new cdk.CfnCondition(this, logicalId, props);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    addCfnResource(props, logicalId) {
        try {
            new cdk.CfnResource(this, logicalId, props);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    addCfnParameter(props, logicalId) {
        try {
            if (this._cfnParameterMap.has(logicalId)) {
                throw new Error('logical Id already Exists');
            }
            this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
        }
        catch (error) {
            throw new Error(error);
        }
    }
}
exports.AmplifyDDBResourceStack = AmplifyDDBResourceStack;
//# sourceMappingURL=ddb-stack-builder.js.map