import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import { AmplifyRootStackTemplate } from '@aws-amplify/cli-extensibility-helper';
import { IStackSynthesizer, ISynthesisSession } from '@aws-cdk/core';
import { AmplifyError, AmplifyFault, JSONUtilities } from 'amplify-cli-core';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Root Stack for AWS Amplify CLI';

export type AmplifyRootStackProps = {
  synthesizer: IStackSynthesizer;
};

export class AmplifyRootStack extends cdk.Stack implements AmplifyRootStackTemplate {
  _scope: cdk.Construct;
  deploymentBucket: s3.CfnBucket;
  authRole: iam.CfnRole;
  unauthRole: iam.CfnRole;
  private _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();

  constructor(scope: cdk.Construct, id: string, props: AmplifyRootStackProps) {
    super(scope, id, props);
    this._scope = scope;
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = ROOT_CFN_DESCRIPTION;
  }

  /**
   *
   * @param props :cdk.CfnOutputProps
   * @param logicalId: : logicalId of the Resource
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    new cdk.CfnOutput(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    new cdk.CfnMapping(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    new cdk.CfnCondition(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    new cdk.CfnResource(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void {
    if (this._cfnParameterMap.has(logicalId)) {
      throw new AmplifyError('DuplicateLogicalIdError', {
        message: `Logical Id already exists: ${logicalId}.`,
      });
    }
    this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
  }

  getCfnParameter(logicalId: string): cdk.CfnParameter {
    if (this._cfnParameterMap.has(logicalId)) {
      return this._cfnParameterMap.get(logicalId);
    }
    throw new AmplifyError('ParameterNotFoundError', {
      message: `Cfn Parameter with LogicalId ${logicalId} doesn't exist`,
    });
  }

  generateRootStackResources = async () => {
    this.deploymentBucket = new s3.CfnBucket(this, 'DeploymentBucket', {
      bucketName: this._cfnParameterMap.get('DeploymentBucketName').valueAsString,
    });

    this.deploymentBucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    this.authRole = new iam.CfnRole(this, 'AuthRole', {
      roleName: this._cfnParameterMap.get('AuthRoleName').valueAsString,
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

    this.unauthRole = new iam.CfnRole(this, 'UnauthRole', {
      roleName: this._cfnParameterMap.get('UnauthRoleName').valueAsString,
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
  };

  /**
   * add Function for Custom Resource in Root stack
   * @param __
   * @returns
   */
  public renderCloudFormationTemplate = (__: ISynthesisSession): string => JSONUtilities.stringify(this._toCloudFormation());
}

/**
 * additional class to merge CFN parameters and CFN outputs as cdk does not allow same logical ID of constructs in same stack
 */
export class AmplifyRootStackOutputs extends cdk.Stack implements AmplifyRootStackTemplate {
  constructor(scope: cdk.Construct, id: string, props: AmplifyRootStackProps) {
    super(scope, id, props);
  }

  deploymentBucket?: s3.CfnBucket;
  authRole?: iam.CfnRole;
  unauthRole?: iam.CfnRole;

  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void {
    throw new AmplifyFault('NotImplementedFault', {
      message: 'Method not implemented.',
    });
  }

  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    new cdk.CfnOutput(this, logicalId, props);
  }

  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    throw new AmplifyFault('NotImplementedFault', {
      message: 'Method not implemented.',
    });
  }

  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    throw new AmplifyFault('NotImplementedFault', {
      message: 'Method not implemented.',
    });
  }

  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    throw new AmplifyFault('NotImplementedFault', {
      message: 'Method not implemented.',
    });
  }

  public renderCloudFormationTemplate = (__: ISynthesisSession): string => JSONUtilities.stringify(this._toCloudFormation());
}
