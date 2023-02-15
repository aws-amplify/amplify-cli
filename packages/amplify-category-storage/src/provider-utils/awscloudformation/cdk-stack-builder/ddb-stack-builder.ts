import * as cdk from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { AmplifyDDBResourceTemplate } from '@aws-amplify/cli-extensibility-helper';
import { DynamoDBCLIInputs, DynamoDBCLIInputsKeyType } from '../service-walkthrough-types/dynamoDB-user-input-types';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'DDB Resource for AWS Amplify CLI';

/**
 * Class to generate Amplify DynamoDB resource for storage category
 */
export class AmplifyDDBResourceStack extends cdk.Stack implements AmplifyDDBResourceTemplate {
  _scope: Construct;
  dynamoDBTable!: ddb.CfnTable;
  _props: DynamoDBCLIInputs;
  _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();

  constructor(scope: Construct, id: string, props: DynamoDBCLIInputs) {
    super(scope, id, undefined);
    this._scope = scope;
    this._props = props;
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = ROOT_CFN_DESCRIPTION;
  }

  /**
   * adds  cfn output to stack
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    try {
      // eslint-disable-next-line no-new
      new cdk.CfnOutput(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * adds cfn mapping to stack
   */
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    try {
      // eslint-disable-next-line no-new
      new cdk.CfnMapping(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * adds cfn condition to stack
   */
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    try {
      // eslint-disable-next-line no-new
      new cdk.CfnCondition(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * adds cfn resource to stack
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    try {
      // eslint-disable-next-line no-new
      new cdk.CfnResource(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * adds cfn parameter to stack
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
