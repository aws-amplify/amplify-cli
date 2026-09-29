import { getProjectInfo } from '@aws-amplify/cli-extensibility-helper';
import { $TSContext, AmplifyError, buildOverrideDir, JSONUtilities, pathManager, runOverride } from '@aws-amplify/amplify-cli-core';
import * as cdk from 'aws-cdk-lib';
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
  app: cdk.App;
  _context: $TSContext;
  _cliInputs: DynamoDBCLIInputs;
  _resourceTemplateObj: AmplifyDDBResourceStack | undefined;
  _cliInputsState: DynamoDBInputState;
  _cfn!: string;
  _cfnInputParams!: AmplifyDDBResourceInputParameters;
  _resourceName: string;

  constructor(context: $TSContext, resourceName: string) {
    this.app = new cdk.App();
    this._context = context;
    this._resourceName = resourceName;

    // Validate the cli-inputs.json for the resource
    this._cliInputsState = new DynamoDBInputState(context, resourceName);
    this._cliInputs = this._cliInputsState.getCliInputPayload();
    void this._cliInputsState.isCLIInputsValid();
  }

  /**
   *  transforms cli-inputs into dynamoDB stack
   */
  async transform(): Promise<void> {
    // Generate  cloudformation stack from cli-inputs.json
    await this.generateStack();

    // Generate  cloudformation stack input params from cli-inputs.json
    this.generateCfnInputParameters();

    // Modify cloudformation files based on overrides
    await this.applyOverrides();

    // Save generated cloudformation.json and parameters.json files
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
   * apply overrides to dynamoDB stack
   */
  async applyOverrides(): Promise<void> {
    const backendDir = pathManager.getBackendDirPath();
    const resourceDirPath = pathManager.getResourceDirectoryPath(undefined, 'storage', this._resourceName);
    const isBuild = await buildOverrideDir(backendDir, resourceDirPath);
    // skip if packageManager or override.ts not found
    if (isBuild) {
      const projectInfo = getProjectInfo();
      try {
        await runOverride(resourceDirPath, this._resourceTemplateObj, projectInfo);
      } catch (err) {
        throw new AmplifyError(
          'InvalidOverrideError',
          {
            message: `Executing overrides failed.`,
            details: err.message,
            resolution: 'There may be runtime errors in your overrides file. If so, fix the errors and try again.',
          },
          err,
        );
      }
    }
  }

  /**
   * generate build files
   */
  saveBuildFiles(): void {
    if (this._resourceTemplateObj) {
      this._cfn = JSON.parse(this._resourceTemplateObj.renderCloudFormationTemplate());
    }

    // store files in local-filesystem

    fs.ensureDirSync(this._cliInputsState.buildFilePath);
    const cfnFilePath = path.resolve(path.join(this._cliInputsState.buildFilePath, `${this._resourceName}-cloudformation-template.json`));
    try {
      JSONUtilities.writeJson(cfnFilePath, this._cfn);
    } catch (e) {
      throw new Error(e);
    }

    fs.ensureDirSync(this._cliInputsState.buildFilePath);
    const cfnInputParamsFilePath = path.resolve(path.join(this._cliInputsState.buildFilePath, 'parameters.json'));
    try {
      JSONUtilities.writeJson(cfnInputParamsFilePath, this._cfnInputParams);
    } catch (e) {
      throw new Error(e);
    }
  }
}
