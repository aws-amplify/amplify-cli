import * as cdk from '@aws-cdk/core';
import { App } from '@aws-cdk/core';
import {
  $TSContext, AmplifyCategories, applyCategoryOverride, JSONUtilities, stateManager,
} from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getDdbAttrType } from '../cfn-template-utils';
import { DynamoDBCLIInputs } from '../service-walkthrough-types/dynamoDB-user-input-types';
import { DynamoDBInputState } from '../service-walkthroughs/dynamoDB-input-state';
import { AmplifyDDBResourceStack } from './ddb-stack-builder';
import { AmplifyDDBResourceInputParameters } from './types';

/**
 * Entry point class to transform User parameters into stack and apply overrides
 */
export class DDBStackTransform {
  app: App;
  _context: $TSContext;
  _cliInputs: DynamoDBCLIInputs;
  _resourceTemplateObj: AmplifyDDBResourceStack | undefined;
  _cliInputsState: DynamoDBInputState;
  _cfn!: string;
  _cfnInputParams!: AmplifyDDBResourceInputParameters;
  _resourceName: string;

  constructor(context: $TSContext, resourceName: string) {
    this.app = new App();
    this._context = context;
    this._resourceName = resourceName;

    // Validate the cli-inputs.json for the resource
    this._cliInputsState = new DynamoDBInputState(context, resourceName);
    this._cliInputs = this._cliInputsState.getCliInputPayload();
  }

  /**
   * Generates CloudFormation stack and parameters, apply any overrides, and saves artifacts
   */
  async transform(): Promise<void> {
    await this._cliInputsState.isCLIInputsValid(this._cliInputs);

    // Generate CloudFormation stack from cli-inputs.json
    await this.generateStack();

    if (this._resourceTemplateObj === undefined) {
      throw new Error(`DynamoDb ${this._resourceName} stack object is undefined`);
    }

    // Generate CloudFormation stack input params from cli-inputs.json
    this.generateCfnInputParameters();

    // Modify CloudFormation files based on overrides

    await applyCategoryOverride<AmplifyDDBResourceStack>(
      AmplifyCategories.STORAGE,
      this._resourceName,
      this._resourceTemplateObj,
    );

    // Save generated CloudFormation.json and parameters.json files
    this.saveBuildFiles();
  }

  /**
   * generates cfn input parameters from cli-inputs
   */
  generateCfnInputParameters(): void {
    this._cfnInputParams = {
      tableName: this._cliInputs.tableName,
      partitionKeyName: this._cliInputs.partitionKey.fieldName,
      partitionKeyType: getDdbAttrType(this._cliInputs.partitionKey.fieldType),
    };
    if (this._cliInputs.sortKey) {
      this._cfnInputParams.sortKeyName = this._cliInputs.sortKey.fieldName;
      this._cfnInputParams.sortKeyType = getDdbAttrType(this._cliInputs.sortKey.fieldType);
    }
    this._cfnInputParams = { ...this._cfnInputParams, ...this._resourceTemplateObj?.getCfnParameterValues() };
  }

  /**
   * generates dynamoDB stack
   */
  async generateStack(): Promise<void> {
    this._resourceTemplateObj = new AmplifyDDBResourceStack(this.app, 'AmplifyDDBResourceStack', this._cliInputs);

    // Add Parameters
    this._resourceTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'partitionKeyName',
    );
    this._resourceTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'partitionKeyType',
    );
    this._resourceTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'env',
    );
    if (this._cliInputs.sortKey) {
      this._resourceTemplateObj.addCfnParameter(
        {
          type: 'String',
        },
        'sortKeyName',
      );

      this._resourceTemplateObj.addCfnParameter(
        {
          type: 'String',
        },
        'sortKeyType',
      );
    }
    this._resourceTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'tableName',
    );

    // Add conditions

    this._resourceTemplateObj.addCfnCondition(
      {
        expression: cdk.Fn.conditionEquals(cdk.Fn.ref('env'), 'NONE'),
      },
      'ShouldNotCreateEnvResources',
    );

    // Add resources

    await this._resourceTemplateObj.generateStackResources();

    // Add outputs
    this._resourceTemplateObj.addCfnOutput(
      {
        value: cdk.Fn.ref('DynamoDBTable'),
      },
      'Name',
    );
    this._resourceTemplateObj.addCfnOutput(
      {
        value: cdk.Fn.getAtt('DynamoDBTable', 'Arn').toString(),
      },
      'Arn',
    );
    this._resourceTemplateObj.addCfnOutput(
      {
        value: cdk.Fn.getAtt('DynamoDBTable', 'StreamArn').toString(),
      },
      'StreamArn',
    );
    this._resourceTemplateObj.addCfnOutput(
      {
        value: cdk.Fn.ref('partitionKeyName'),
      },
      'PartitionKeyName',
    );
    this._resourceTemplateObj.addCfnOutput(
      {
        value: cdk.Fn.ref('partitionKeyType'),
      },
      'PartitionKeyType',
    );

    if (this._cliInputs.sortKey) {
      this._resourceTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.ref('sortKeyName'),
        },
        'SortKeyName',
      );
      this._resourceTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.ref('sortKeyType'),
        },
        'SortKeyType',
      );
    }

    this._resourceTemplateObj.addCfnOutput(
      {
        value: cdk.Fn.ref('AWS::Region'),
      },
      'Region',
    );
  }

  /**
   * Save build artifacts
   */
  saveBuildFiles(): void {
    if (this._resourceTemplateObj) {
      this._cfn = JSONUtilities.parse(this._resourceTemplateObj.renderCloudFormationTemplate());
    }

    // store files in local-filesystem

    fs.ensureDirSync(this._cliInputsState.buildFilePath);
    // eslint-disable-next-line spellcheck/spell-checker
    const cfnFilePath = path.join(this._cliInputsState.buildFilePath, `${this._resourceName}-cloudformation-template.json`);
    JSONUtilities.writeJson(cfnFilePath, this._cfn);

    fs.ensureDirSync(this._cliInputsState.buildFilePath);
    stateManager.setResourceParametersJson(undefined, AmplifyCategories.STORAGE, this._resourceName, this._cfnInputParams);
  }
}
