/* eslint-disable no-new */
/* eslint-disable max-classes-per-file */
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { AmplifyRootStackTemplate } from '@aws-amplify/cli-extensibility-helper';
import { IStackSynthesizer } from 'aws-cdk-lib';
import { AmplifyError, AmplifyFault, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { Construct } from 'constructs';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Root Stack for AWS Amplify CLI';

/**
 * amplify root stack properties
 */
export type AmplifyRootStackProps = {
  synthesizer: IStackSynthesizer;
};

/**
 * Construct to generate amplify root stack
 */
export class AmplifyRootStack extends cdk.Stack implements AmplifyRootStackTemplate {
  _scope: Construct;
  deploymentBucket: s3.CfnBucket;
  authRole: iam.CfnRole;
  unauthRole: iam.CfnRole;
  private _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();

  constructor(scope: Construct, id: string, props: AmplifyRootStackProps) {
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
   * adds cfn mapping to stack
   */
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    new cdk.CfnMapping(this, logicalId, props);
  }

  /**
   * adds cfn condition to stack
   */
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    new cdk.CfnCondition(this, logicalId, props);
  }

  /**
   * adds cfn resource to stack
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    new cdk.CfnResource(this, logicalId, props);
  }

  /**
   * adds cfn parameter to stack
   */
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void {
    if (this._cfnParameterMap.has(logicalId)) {
      throw new AmplifyError('DuplicateLogicalIdError', {
        message: `Logical Id already exists: ${logicalId}.`,
      });
    }
    this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
  }

  /**
   * return cfn parameter with given logicalID
   */
  getCfnParameter(logicalId: string): cdk.CfnParameter {
    if (this._cfnParameterMap.has(logicalId)) {
      return this._cfnParameterMap.get(logicalId);
    }
    throw new AmplifyError('ParameterNotFoundError', {
      message: `Cfn Parameter with LogicalId ${logicalId} doesn't exist`,
    });
  }

  generateRootStackResources = async (): Promise<void> => {
    const bucketName = this._cfnParameterMap.get('DeploymentBucketName').valueAsString;
    this.deploymentBucket = new s3.CfnBucket(this, 'DeploymentBucket', {
      bucketName: bucketName,
    });

    this.deploymentBucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    new s3.CfnBucketPolicy(this, 'DeploymentBucketBlockHTTP', {
      bucket: bucketName,
      policyDocument: {
        Statement: [
          {
            Action: 's3:*',
            Effect: 'Deny',
            Principal: '*',
            Resource: [`arn:aws:s3:::${bucketName}/*`, `arn:aws:s3:::${bucketName}`],
            Condition: {
              Bool: {
                'aws:SecureTransport': false,
              },
            },
          },
        ],
        OwnershipStatement: [
          {
            Action: 's3:*',
            Effect: 'Deny',
            Principal: '*',
            Resource: [`arn:aws:s3:::${bucketName}/*`, `arn:aws:s3:::${bucketName}`],
            Condition: {
              StringNotEquals: {
                's3:ResourceAccount': cdk.Stack.of(this).account,
              },
            },
          },
        ],
      },
    });

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
   */
  public renderCloudFormationTemplate = (): string => JSONUtilities.stringify(this._toCloudFormation());
}

/**
 * additional class to merge CFN parameters and CFN outputs as cdk does not allow same logical ID of constructs in same stack
 */
export class AmplifyRootStackOutputs extends cdk.Stack implements AmplifyRootStackTemplate {
  deploymentBucket?: s3.CfnBucket;
  authRole?: iam.CfnRole;
  unauthRole?: iam.CfnRole;

  /**
   * adds cfn parameter to stack
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnParameter(): void {
    throw new AmplifyFault('NotImplementedFault', {
      message: 'Method not implemented.',
    });
  }

  /**
   * adds cfn output to stack
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    new cdk.CfnOutput(this, logicalId, props);
  }

  /**
   * adds cfn mapping to stack
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnMapping(): void {
    throw new AmplifyFault('NotImplementedFault', {
      message: 'Method not implemented.',
    });
  }

  /**
   * adds cfn condition to stack
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnCondition(): void {
    throw new AmplifyFault('NotImplementedFault', {
      message: 'Method not implemented.',
    });
  }

  /**
   * adds cfn resource to stack
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnResource(): void {
    throw new AmplifyFault('NotImplementedFault', {
      message: 'Method not implemented.',
    });
  }

  public renderCloudFormationTemplate = (): string => JSONUtilities.stringify(this._toCloudFormation());
}

// force major version bump for cdk v2
