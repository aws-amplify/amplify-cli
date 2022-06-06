/* eslint-disable max-classes-per-file */
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import { AmplifyRootStackTemplate } from '@aws-amplify/cli-extensibility-helper';
import { IStackSynthesizer, ISynthesisSession } from '@aws-cdk/core';
import { $TSAny } from 'amplify-cli-core';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Root Stack for AWS Amplify CLI';

/**
 * Properties to the AmplifyRootStack constructor
 */
export type AmplifyRootStackProps = {
  synthesizer: IStackSynthesizer;
};

/**
 * CDK construct for the environment root stack
 */
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
   * Add an output to the stack
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
   * Add a mapping to the stack
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
   * Add a condition to the stack
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
   * Add a resource to the stack
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
   * Add CFN parameter to root stack
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

  /**
   * Get CFN parameter by logical id
   */
  getCfnParameter(logicalId: string): cdk.CfnParameter {
    if (this._cfnParameterMap.has(logicalId)) {
      return this._cfnParameterMap.get(logicalId);
    }
    throw new Error(`Cfn Parameter with LogicalId ${logicalId} doesn't exist`);
  }

  /**
   * Populates the root stack with default resources
   */
  async generateRootStackResources(): Promise<void> {
    const bucketName = this._cfnParameterMap.get('DeploymentBucketName').valueAsString;
    this.deploymentBucket = new s3.CfnBucket(this, 'DeploymentBucket', {
      bucketName,
      publicAccessBlockConfiguration: s3.BlockPublicAccess.BLOCK_ALL,
    });

    this.deploymentBucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    // eslint-disable-next-line no-new
    new s3.CfnBucketPolicy(this, 'DeploymentBucketBlockHTTP', {
      bucket: bucketName,
      policyDocument: {
        Statement: [
          {
            Action: 's3:*',
            Effect: 'Deny',
            Principal: '*',
            Resource: [
              `arn:aws:s3:::${bucketName}/*`,
              `arn:aws:s3:::${bucketName}`,
            ],
            Condition: {
              Bool: {
                'aws:SecureTransport': false,
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
  }

  // add Function for Custom Resource in Root stack
  /**
   * Synthesizes the template into a JSON string
   */
  public renderCloudFormationTemplate = (_: ISynthesisSession): string => JSON.stringify(this._toCloudFormation(), undefined, 2);
}

/**
 * Additional class to merge CFN parameters and CFN outputs as cdk doesn't allow same logical ID of constructs in same stack
 */
export class AmplifyRootStackOutputs extends cdk.Stack implements AmplifyRootStackTemplate {
  deploymentBucket?: s3.CfnBucket;
  authRole?: iam.CfnRole;
  unauthRole?: iam.CfnRole;

  /**
   * Method not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnParameter(/* _props: cdk.CfnConditionProps, _logicalId: string */): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Adds an output to the stack
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
   * Method not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnMapping(): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Method not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnCondition(/* _props: cdk.CfnConditionProps, _logicalId: string */): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Method not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnResource(/* _props: cdk.CfnResourceProps, _logicalId: string */): void {
    throw new Error('Method not implemented.');
  }

  public renderCloudFormationTemplate =
    (_: ISynthesisSession): string => JSON.stringify((this as $TSAny)._toCloudFormation(), undefined, 2);
}
