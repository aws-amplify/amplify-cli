import { DynamoDBCLIInputs } from '../service-walkthrough-types/dynamoDB-user-input-types';
import { DynamoDBInputState } from '../service-walkthroughs/dynamoDB-input-state';
import { AmplifyDDBResourceStack } from './ddb-stack-builder';
import { AmplifyDDBResourceInputParameters, AmplifyDDBResourceTemplate } from './types';
import { App } from '@aws-cdk/core';
import * as cdk from '@aws-cdk/core';
import * as fs from 'fs-extra';
import { JSONUtilities, pathManager, buildOverrideDir, $TSAny } from 'amplify-cli-core';
import * as path from 'path';
import { formatter, printer } from 'amplify-prompts';

export class DDBStackTransform {
  app: App;
  _cliInputs: DynamoDBCLIInputs;
  _resourceTemplateObj: AmplifyDDBResourceStack | undefined;
  _cliInputsState: DynamoDBInputState;
  _cfn!: string;
  _cfnInputParams!: AmplifyDDBResourceInputParameters;
  _resourceName: string;

  constructor(resourceName: string) {
    this.app = new App();
    this._resourceName = resourceName;

    // Validate the cli-inputs.json for the resource
    this._cliInputsState = new DynamoDBInputState(resourceName);
    this._cliInputs = this._cliInputsState.getCliInputPayload();
    this._cliInputsState.isCLIInputsValid();
  }

  async transform() {
    // Generate  cloudformation stack from cli-inputs.json
    await this.generateStack();

    // Generate  cloudformation stack input params from cli-inputs.json
    this.generateCfnInputParameters();

    // Modify cloudformation files based on overrides
    await this.applyOverrides();

    // Save generated cloudformation.json and parameters.json files
    this.saveBuildFiles();
  }

  generateCfnInputParameters() {
    this._cfnInputParams = {
      tableName: this._cliInputs.tableName,
      partitionKeyName: this._cliInputs.partitionKey.fieldName,
      partitionKeyType: this._cliInputs.partitionKey.fieldType,
    };
    if (this._cliInputs.sortKey) {
      this._cfnInputParams.sortKeyName = this._cliInputs.sortKey.fieldName;
      this._cfnInputParams.sortKeyType = this._cliInputs.sortKey.fieldType;
    }
  }

  async generateStack() {
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

  async applyOverrides() {
    const backendDir = pathManager.getBackendDirPath();
    const overrideFilePath = pathManager.getResourceDirectoryPath(undefined, 'storage', this._resourceName);

    const isBuild = await buildOverrideDir(backendDir, overrideFilePath).catch(error => {
      printer.warn(`Skipping build as ${error.message}`);
      return false;
    });
    // skip if packageManager or override.ts not found
    if (isBuild) {
      const { overrideProps } = await import(path.join(overrideFilePath, 'build', 'override.js')).catch(error => {
        formatter.list(['No override File Found', `To override ${this._resourceName} run amplify override auth ${this._resourceName} `]);
        return undefined;
      });

      // pass stack object
      const ddbStackTemplateObj = this._resourceTemplateObj as AmplifyDDBResourceTemplate;
      //TODO: Check Script Options
      if (typeof overrideProps === 'function' && overrideProps) {
        try {
          this._resourceTemplateObj = overrideProps(this._resourceTemplateObj as AmplifyDDBResourceTemplate);

          //The vm module enables compiling and running code within V8 Virtual Machine contexts. The vm module is not a security mechanism. Do not use it to run untrusted code.
          // const script = new vm.Script(overrideCode);
          // script.runInContext(vm.createContext(cognitoStackTemplateObj));
          return;
        } catch (error: $TSAny) {
          throw new Error(error);
        }
      }
    }
  }

  saveBuildFiles() {
    if (this._resourceTemplateObj) {
      this._cfn = JSON.parse(this._resourceTemplateObj.renderCloudFormationTemplate());
    }

    // store files in local-filesysten

    fs.ensureDirSync(this._cliInputsState.buildFilePath);
    const cfnFilePath = path.resolve(path.join(this._cliInputsState.buildFilePath, 'cloudformation-template.json'));
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
