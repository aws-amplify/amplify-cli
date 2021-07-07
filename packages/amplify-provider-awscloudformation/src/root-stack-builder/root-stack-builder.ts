import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as path from 'path'
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import {AmplifyRootStackTemplateProps} from './types';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import * as constants from '../constants'

  
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = "Root Stack for AWS Amplify CLI";


export class AmplifyRootStack extends cdk.Stack {
    public templateObj: AmplifyRootStackTemplateProps
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
        this.templateOptions.description = ROOT_CFN_DESCRIPTION;

        this.templateObj.Parameters.deploymentBucketName = new cdk.CfnParameter(this, 'DeploymentBucketName', {
            type: 'String',
            description: "Name of the common deployment bucket provided by the parent stack",
            default: "DeploymentBucket"
        });
  
        this.templateObj.Parameters.authRoleName = new cdk.CfnParameter(this, 'AuthRoleName', {
            type: 'String',
            default: "AuthRoleName"
        });
  
        this.templateObj.Parameters.unauthRoleName = new cdk.CfnParameter(this, 'UnauthRoleName', {
            type: 'String',
            default: "UnauthRoleName"
        });

        this.templateObj.Resources.DeploymentBucket= new s3.CfnBucket(this,'rootStack',{
            bucketName: this.templateObj.Parameters.deploymentBucketName.valueAsString
        });

        this.templateObj.Resources.DeploymentBucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN)

        const authRole = new iam.CfnRole(this,'AuthRole',{
            roleName: this.templateObj.Parameters.authRoleName.valueAsString,
            assumeRolePolicyDocument:{
                Version: "2012-10-17",
                Statement: [
                {
                    Sid: "",
                    Effect: "Deny",
                    Principal: {
                    Federated: "cognito-identity.amazonaws.com"
                    },
                    Action: "sts:AssumeRoleWithWebIdentity"
                }
                ]
            }
        });

        const unauthRole = new iam.CfnRole(this,'UnauthRole',{
            roleName: this.templateObj.Parameters.unauthRoleName.valueAsString,
            assumeRolePolicyDocument:{
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "",
                    Effect: "Deny",
                    Principal: {
                        Federated: "cognito-identity.amazonaws.com"
                    },
                    Action: "sts:AssumeRoleWithWebIdentity"
                }] 
            }
        });

        this.templateObj.Outputs.unauthRoleName = new cdk.CfnOutput(this, 'Region', {
            description: 'CloudFormation provider root stack Region',
            value: cdk.Fn.ref('AWS::Region'),
            exportName:cdk.Fn.sub('${AWS::StackName}-Region')
        });

        this.templateObj.Outputs.stackName = new cdk.CfnOutput(this, 'StackName', {
            description: 'CloudFormation provider root stack ID',
            value: cdk.Fn.ref('AWS::StackName'),
            exportName:cdk.Fn.sub('${AWS::StackName}-StackName')
        });

        this.templateObj.Outputs.stackId = new cdk.CfnOutput(this, 'StackId', {
            description: 'CloudFormation provider root stack name',
            value: cdk.Fn.ref('AWS::StackId'),
            exportName:cdk.Fn.sub('${AWS::StackName}-Region')
        });

        this.templateObj.Outputs.deploymentBucketName = new cdk.CfnOutput(this, 'DeploymentBucketName', {
            description: 'CloudFormation provider root stack deployment bucket name',
            value: this.templateObj.Parameters.deploymentBucketName.valueAsString,
            exportName:cdk.Fn.sub('${AWS::StackName}-DeploymentBucketName')
        });

        this.templateObj.Outputs.authRoleArn = new cdk.CfnOutput(this, 'AuthRoleArn', {
            value: cdk.Fn.getAtt('AuthRole','Arn').toString(),
        });

        this.templateObj.Outputs.unauthRoleArn = new cdk.CfnOutput(this, 'UnauthRoleArn', {
            value: cdk.Fn.getAtt('UnAuthRole','Arn').toString(),
        });

        this.templateObj.Outputs.authRoleName = new cdk.CfnOutput(this, 'AuthRoleName', {
            value: this.templateObj.Parameters.authRoleName.valueAsString,
        });

        const unauthRoleName = new cdk.CfnOutput(this, 'AuthRoleArn', {
            value: this.templateObj.Parameters.unauthRoleName.valueAsString
        });

    }
  
    toCloudFormation() {
      prepareApp(this);
      return this._toCloudFormation();
    }
}

export enum CommandType {
    "PUSH" , "INIT"
}

type RootStackOptions = {
    stackName: string;
    modifiers?: Function[];
    rootStackFileName:string;
    event: CommandType
}

export const generateRootStackTemplate = (props: RootStackOptions) => {
    const stack = new AmplifyRootStack(undefined as any, 'Amplify');
    if(props.event === CommandType.INIT){
        // no override required
        //apply init modifiers if any
    }

    if(props.event === CommandType.PUSH){
        props.modifiers.forEach(cfnModifier => {
            cfnModifier(stack.templateObj.Resources);
        })
        // apply override here during push
    }

    const cfnRootStack = stack.toCloudFormation();
    const backEndDir = pathManager.getBackendDirPath();
    const nestedStackFilepath = path.normalize(path.join(backEndDir, constants.providerName, props.rootStackFileName));
    JSONUtilities.writeJson(nestedStackFilepath,cfnRootStack)
}