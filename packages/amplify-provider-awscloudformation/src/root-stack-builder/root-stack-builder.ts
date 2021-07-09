import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as path from 'path';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import { AmplifyRootStackResourceProps, AmplifyRootStackTemplateProps } from './types';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import * as constants from '../constants';
import { Template } from 'cloudform-types';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Root Stack for AWS Amplify CLI';

export class AmplifyRootStack extends cdk.Stack {
  public templateObj: AmplifyRootStackTemplateProps;
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = ROOT_CFN_DESCRIPTION;
    const CfnParameters: { [k: string]: cdk.CfnParameter } = {};

    CfnParameters.deploymentBucketName = new cdk.CfnParameter(this, 'DeploymentBucketName', {
      type: 'String',
      description: 'Name of the common deployment bucket provided by the parent stack',
      default: 'DeploymentBucket',
    });

    CfnParameters.authRoleName = new cdk.CfnParameter(this, 'AuthRoleName', {
      type: 'String',
      default: 'AuthRoleName',
    });

    CfnParameters.unauthRoleName = new cdk.CfnParameter(this, 'UnauthRoleName', {
      type: 'String',
      default: 'UnauthRoleName',
    });
    // Reources

    let CfnResources: AmplifyRootStackResourceProps = {};
    CfnResources.DeploymentBucket = new s3.CfnBucket(this, 'DeploymentBucket', {
      bucketName: CfnParameters['deploymentBucketName'].valueAsString,
    });

    CfnResources.DeploymentBucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    CfnResources.authRole = new iam.CfnRole(this, 'AuthRole', {
      roleName: CfnParameters['authRoleName'].valueAsString,
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: '',
            Effect: 'Deny',
            Principal: {
              Federated: 'cognito-identity.amazonaws.com',
            },
            Action: 'sts:AssumeRoleWithWebIdentity',
          },
        ],
      },
    });

    CfnResources.unauthRole = new iam.CfnRole(this, 'UnauthRole', {
      roleName: CfnParameters['unauthRoleName'].valueAsString,
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: '',
            Effect: 'Deny',
            Principal: {
              Federated: 'cognito-identity.amazonaws.com',
            },
            Action: 'sts:AssumeRoleWithWebIdentity',
          },
        ],
      },
    });

    const cfnOutputs: { [k: string]: cdk.CfnOutput } = {};
    cfnOutputs.Region = new cdk.CfnOutput(this, 'Region', {
      description: 'CloudFormation provider root stack Region',
      value: cdk.Fn.ref('AWS::Region'),
      exportName: cdk.Fn.sub('${AWS::StackName}-Region'),
    });

    cfnOutputs.stackName = new cdk.CfnOutput(this, 'StackName', {
      description: 'CloudFormation provider root stack ID',
      value: cdk.Fn.ref('AWS::StackName'),
      exportName: cdk.Fn.sub('${AWS::StackName}-StackName'),
    });

    cfnOutputs.stackId = new cdk.CfnOutput(this, 'StackId', {
      description: 'CloudFormation provider root stack name',
      value: cdk.Fn.ref('AWS::StackId'),
      exportName: cdk.Fn.sub('${AWS::StackName}-StackId'),
    });

    cfnOutputs.authRoleArn = new cdk.CfnOutput(this, 'AuthRoleArn', {
      value: cdk.Fn.getAtt('AuthRole', 'Arn').toString(),
    });

    cfnOutputs.unauthRoleArn = new cdk.CfnOutput(this, 'UnauthRoleArn', {
      value: cdk.Fn.getAtt('UnauthRole', 'Arn').toString(),
    });
    this.templateObj = {};
    this.templateObj['Parameters'] = { ...CfnParameters };
    this.templateObj['Outputs'] = { ...cfnOutputs };
    this.templateObj.Resources = { ...CfnResources };
  }

  toCloudFormation() {
    prepareApp(this);
    return this._toCloudFormation();
  }
}

export enum CommandType {
  'PUSH',
  'INIT',
}

type RootStackOptions = {
  rootStackFileName: string;
  event: CommandType;
};

export class AmplifyRootStackOutputs extends cdk.Stack {
  public templateObj: AmplifyRootStackTemplateProps;
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);
    const cfnOutputs: { [k: string]: cdk.CfnOutput } = {};
    cfnOutputs.deploymentBucketName = new cdk.CfnOutput(this, 'DeploymentBucketName', {
      description: 'CloudFormation provider root stack deployment bucket name',
      value: cdk.Fn.ref('DeploymentBucketName'),
      exportName: cdk.Fn.sub('${AWS::StackName}-DeploymentBucketName'),
    });

    cfnOutputs.authRoleName = new cdk.CfnOutput(this, 'AuthRoleName', {
      value: cdk.Fn.ref('AuthRoleName'),
    });

    cfnOutputs.unauthRoleName = new cdk.CfnOutput(this, 'UnauthRoleName', {
      value: cdk.Fn.ref('UnauthRoleName'),
    });
    this.templateObj = {};
    this.templateObj['Outputs'] = { ...cfnOutputs };
  }

  toCloudFormation() {
    prepareApp(this);
    return this._toCloudFormation();
  }
}

export const generateRootStackTemplate = async (props: RootStackOptions): Promise<Template> => {
  const stack = new AmplifyRootStack(undefined as any, 'Amplify');
  const stackOutputs = new AmplifyRootStackOutputs(undefined as any, 'AmplifyOutputs');
  // merge the outputs in one to get the combined object
  //Object.assign(stack.templateObj,stackOutputs.templateObj);
  if (props.event === CommandType.INIT) {
    // no override required
    //apply init modifiers if any
  }

  if (props.event === CommandType.PUSH) {
    // apply override here during push
    //applyoverrides(stack.templateObj);
  }

  const cfnRootStack: Template = stack.toCloudFormation();
  const cfnRootStackOutputs: Template = stackOutputs.toCloudFormation();
  Object.assign(cfnRootStack.Outputs, cfnRootStackOutputs.Outputs);
  JSONUtilities.writeJson('/Users/akz/workspace/projects/init_check6/template.yml', cfnRootStack);
  return cfnRootStack;
};

// class AmplifyTransform {
//     transform();
//     generateResources();
//     applyOverrides();
//     synthesizeTemplates();
// }
