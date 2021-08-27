import {DynamoDBCLIInputs} from '../service-walkthrough-types/dynamoDB-user-input-types'
import { DynamoDBInputState } from '../service-walkthroughs/dynamoDB-input-state';
import {AmplifyDDBResourceStack} from './ddb-stack-builder'
import {AmplifyDDBResourceInputParameters} from './types'
import { App } from '@aws-cdk/core';
import * as cdk from '@aws-cdk/core';
import * as fs from 'fs-extra';
import { JSONUtilities } from 'amplify-cli-core';
import path from 'path';

export class DDBStackTransform {
    app: App;
    cliInputs: DynamoDBCLIInputs;
    _resourceTemplateObj: AmplifyDDBResourceStack | undefined;
    cliInputsState: DynamoDBInputState;
    cfn!: string;
    cfnInputParams!: AmplifyDDBResourceInputParameters;

    constructor(resourceName: string) {
        this.app = new App();

        // Validate the cli-inputs.json for the resource
        this.cliInputsState = new DynamoDBInputState(resourceName);
        this.cliInputs = this.cliInputsState.getCliInputPayload();
        this.cliInputsState.isCLIInputsValid();
    }

    async transform() {

        // Generate  cloudformation stack from cli-inputs.json
        await this.generateStack();

        // Generate  cloudformation stack from cli-inputs.json
        this.generateCfnInputParameters();

        // Modify cloudformation files based on overrides
        this.applyOverrides()

        // Save generated cloudformation.json and parameters.json files
        this.saveBuildFiles();

    }

    generateCfnInputParameters() {

        this.cfnInputParams = {
            tableName: this.cliInputs.tableName,
            partitionKeyName: this.cliInputs.partitionKey.fieldName,
            partitionKeyType: this.cliInputs.partitionKey.fieldType
        };
        if(this.cliInputs.sortKey) {
            this.cfnInputParams.sortKeyName = this.cliInputs.sortKey.fieldName;
            this.cfnInputParams.sortKeyType = this.cliInputs.sortKey.fieldType;
        }
        
    }

    async generateStack() {
        this._resourceTemplateObj = new AmplifyDDBResourceStack(this.app, 'AmplifyDDBResourceStack', this.cliInputs);

        // Add Parameters
        this._resourceTemplateObj.addCfnParameter(
            {
              type: 'String'
            },
            "partitionKeyName",
        );
        this._resourceTemplateObj.addCfnParameter(
            {
              type: 'String'
            },
            "partitionKeyType",
        );
        this._resourceTemplateObj.addCfnParameter(
            {
              type: 'String'
            },
            "env",
        );
        if(this.cliInputs.sortKey) {

            this._resourceTemplateObj.addCfnParameter(
                {
                  type: 'String'
                },
                "sortKeyName",
            );

            this._resourceTemplateObj.addCfnParameter(
                {
                  type: 'String'
                },
                "sortKeyType",
            );
            
        }
        this._resourceTemplateObj.addCfnParameter(
            {
              type: 'String'
            },
            "tableName",
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

        if(this.cliInputs.sortKey) {
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

        this.cfn = JSON.parse(this._resourceTemplateObj.renderCloudFormationTemplate());
    }

    applyOverrides() {
        // build overrides
        // get modified props from overrides
    }

    saveBuildFiles() {
        // store files in local-filesysten

        fs.ensureDirSync(this.cliInputsState.buildFilePath);
        const cfnFilePath = path.resolve(path.join(this.cliInputsState.buildFilePath, 'cloudformation-template.json'));
        try {
          JSONUtilities.writeJson(cfnFilePath, this.cfn);
        } catch (e) {
          throw new Error(e);
        }

        fs.ensureDirSync(this.cliInputsState.buildFilePath);
        const cfnInputParamsFilePath = path.resolve(path.join(this.cliInputsState.buildFilePath, 'parameters.json'));
        try {
          JSONUtilities.writeJson(cfnInputParamsFilePath, this.cfnInputParams);
        } catch (e) {
          throw new Error(e);
        }
    }

}