import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import { AmplifyRootStackResource, AmplifyRootStackTemplate } from './types';
import { IStackSynthesizer, ISynthesisSession } from '@aws-cdk/core';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Root Stack for AWS Amplify CLI';

export type AmplifyRootStackProps = {
  synthesizer: IStackSynthesizer;
};

export class AmplifyRootStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: AmplifyRootStackProps, templateObj: AmplifyRootStackTemplate) {
    super(scope, id, props);
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

    let CfnResources: AmplifyRootStackResource = {};
    CfnResources.deploymentBucket = new s3.CfnBucket(this, 'DeploymentBucket', {
      bucketName: CfnParameters['deploymentBucketName'].valueAsString,
    });

    CfnResources.deploymentBucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

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
    templateObj = {};
    templateObj['Parameters'] = { ...CfnParameters };
    templateObj['Outputs'] = { ...cfnOutputs };
    templateObj.Resources = { ...CfnResources };
  }

  public renderCloudFormationTemplate = (_: ISynthesisSession): string => {
    return JSON.stringify((this as any)._toCloudFormation(), undefined, 2);
  };
}

/**
 * additional class to merge CFN parameters and CFN outputs as cdk doesnt allow same logical ID of constructs in same stack
 */
export class AmplifyRootStackOutputs extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: AmplifyRootStackProps, templateObj: AmplifyRootStackTemplate) {
    super(scope, id, props);
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
    templateObj = {};
    templateObj['Outputs'] = { ...cfnOutputs };
  }

  public renderCloudFormationTemplate = (_: ISynthesisSession): string => {
    return JSON.stringify((this as any)._toCloudFormation(), undefined, 2);
  };
}
