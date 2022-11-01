/* eslint-disable no-new */
import * as cdk from '@aws-cdk/core';
import * as ddb from '@aws-cdk/aws-dynamodb';
import { AmplifyDDBResourceTemplate } from '@aws-amplify/cli-extensibility-helper';
import { $TSAny, $TSObject } from 'amplify-cli-core';
import { DynamoDBCLIInputs, DynamoDBCLIInputsKeyType } from '../service-walkthrough-types/dynamoDB-user-input-types';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'DDB Resource for AWS Amplify CLI';

/**
 * Class to generate Amplify DynamoDB resource for storage category
 */
export class AmplifyDDBResourceStack extends cdk.Stack implements AmplifyDDBResourceTemplate {
  _scope: cdk.Construct;
  dynamoDBTable!: ddb.CfnTable;
  _props: DynamoDBCLIInputs;
  _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();
  _cfnParameterValues: $TSObject;

  constructor(scope: cdk.Construct, id: string, props: DynamoDBCLIInputs) {
    super(scope, id, undefined);
    this._scope = scope;
    this._props = props;
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = ROOT_CFN_DESCRIPTION;
    this._cfnParameterValues = {};
  }

  /**
   * add CloudFormation output to stack
   * @param props : cdk.CfnOutputProps
   * @param logicalId : logicalId of the Resource
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    new cdk.CfnOutput(this, logicalId, props);
  }

  /**
   * add CloudFormation mapping to stack
   * @param props : cdk.CfnMappingProps
   * @param logicalId : logicalId of the Resource
   */
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    new cdk.CfnMapping(this, logicalId, props);
  }

  /**
   * add CloudFormation condition to stack
   * @param props : cdk.CfnConditionProps
   * @param logicalId : logicalId of the Resource
   */
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    new cdk.CfnCondition(this, logicalId, props);
  }

  /**
   * add CloudFormation resource to stack
   * @param props : cdk.CfnResourceProps
   * @param logicalId : logicalId of the Resource
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    new cdk.CfnResource(this, logicalId, props);
  }

  /**
   * add CloudFormation parameter to stack
   * @param props : cdk.CfnParameterProps
   * @param logicalId : logical identifier of the parameter
   * @param value ?: optional value to be stored in build/parameters.json
   */
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string, value?: $TSAny): void {
    if (this._cfnParameterMap.has(logicalId)) {
      throw new Error('logical Id already exists');
    }
    this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
    if (value !== undefined) {
      this._cfnParameterValues[logicalId] = value;
    }
  }

  getCfnParameterValues(): $TSObject {
    return this._cfnParameterValues;
  }

  generateStackResources = async (): Promise<void> => {
    const usedAttributes: DynamoDBCLIInputsKeyType[] = [];
    const keySchema: ddb.CfnTable.KeySchemaProperty[] = [];
    const globalSecondaryIndexes: ddb.CfnTable.GlobalSecondaryIndexProperty[] = [];

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
      this._props.gsi.forEach(gsi => {
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

        if (usedAttributes.findIndex(attr => attr.fieldName === gsi.partitionKey.fieldName) === -1) {
          usedAttributes.push(gsi.partitionKey);
        }
        if (gsi.sortKey) {
          gsiIndex.keySchema.push({
            attributeName: gsi.sortKey?.fieldName,
            keyType: 'RANGE',
          });
          if (usedAttributes.findIndex(attr => attr?.fieldName === gsi.sortKey?.fieldName) === -1) {
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

    const attributeMapping: ddb.CfnTable.AttributeDefinitionProperty[] = [];

    usedAttributes.forEach((attr: DynamoDBCLIInputsKeyType) => {
      attributeMapping.push({
        attributeName: attr.fieldName,
        attributeType: ddbAttrTypeMapping[attr.fieldType],
      });
    });

    this.dynamoDBTable = new ddb.CfnTable(this, 'DynamoDBTable', {
      tableName: cdk.Fn.conditionIf(
        'ShouldNotCreateEnvResources',
        cdk.Fn.ref('tableName'),
        cdk.Fn.join('', [cdk.Fn.ref('tableName'), '-', cdk.Fn.ref('env')]),
      ).toString(),
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

  public renderCloudFormationTemplate = (): string => JSON.stringify(this._toCloudFormation(), undefined, 2);
}
