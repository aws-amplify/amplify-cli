import * as cdk from '@aws-cdk/core';
import * as ddb from '@aws-cdk/aws-dynamodb';
import { DynamoDBCLIInputs, DynamoDBCLIInputsKeyType, FieldType } from '../service-walkthrough-types/dynamoDB-user-input-types';
import { AmplifyDDBResourceTemplate } from './types';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'DDB Resource for AWS Amplify CLI';

export class AmplifyDDBResourceStack extends cdk.Stack implements AmplifyDDBResourceTemplate {
  _scope: cdk.Construct;
  dynamoDBTable!: ddb.CfnTable;
  _props: DynamoDBCLIInputs;
  _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();

  constructor(scope: cdk.Construct, id: string, props: DynamoDBCLIInputs) {
    super(scope, id, undefined);
    this._scope = scope;
    this._props = props;
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = ROOT_CFN_DESCRIPTION;
  }

  /**
   *
   * @param props :cdk.CfnOutputProps
   * @param logicalId: : lodicalId of the Resource
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    try {
      new cdk.CfnOutput(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    try {
      new cdk.CfnMapping(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    try {
      new cdk.CfnCondition(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }
  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    try {
      new cdk.CfnResource(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void {
    try {
      if (this._cfnParameterMap.has(logicalId)) {
        throw new Error('logical Id already Exists');
      }
      this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
    } catch (error) {
      throw new Error(error);
    }
  }

  generateStackResources = async () => {
    let usedAttributes: DynamoDBCLIInputsKeyType[] = [];
    let keySchema: ddb.CfnTable.KeySchemaProperty[] = [];
    let globalSecondaryIndexes: ddb.CfnTable.GlobalSecondaryIndexProperty[] = [];

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
        let gsiIndex = {
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
          if (usedAttributes.findIndex(attr => attr?.fieldName === gsi.sortKey?.fieldName) == -1) {
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

    let attributeMapping: ddb.CfnTable.AttributeDefinitionProperty[] = [];

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

  public renderCloudFormationTemplate = (): string => {
    return JSON.stringify(this._toCloudFormation(), undefined, 2);
  };
}
