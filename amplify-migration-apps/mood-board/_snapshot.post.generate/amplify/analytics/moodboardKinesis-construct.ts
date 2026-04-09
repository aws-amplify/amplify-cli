import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import { Construct } from 'constructs';

export interface analyticsmoodboardKinesisProps {
  /**
   */
  readonly kinesisStreamName: string;
  /**
   * @default 1
   */
  readonly kinesisStreamShardCount?: number;
  /**
   */
  readonly authPolicyName: string;
  /**
   */
  readonly unauthPolicyName: string;
  /**
   */
  readonly authRoleName: string;
  /**
   */
  readonly unauthRoleName: string;
  /**
   */
  readonly branchName: string;
}

/**
 * {"createdOn":"Mac","createdBy":"Amplify","createdWith":"14.2.5","stackType":"analytics-Kinesis","metadata":{"whyContinueWithGen1":"Prefer not to answer"}}
 */
export class analyticsmoodboardKinesis extends Construct {
  public readonly kinesisStreamArn;
  public readonly kinesisStreamId;
  public readonly kinesisStreamShardCount;

  public constructor(
    scope: Construct,
    id: string,
    props: analyticsmoodboardKinesisProps
  ) {
    super(scope, id);

    // Applying default props
    props = {
      ...props,
      kinesisStreamShardCount: props.kinesisStreamShardCount ?? 1,
    };

    // Resources
    const kinesisStream = new kinesis.CfnStream(this, 'KinesisStream', {
      name: [props.kinesisStreamName!, props.branchName!].join('-'),
      shardCount: props.kinesisStreamShardCount!,
    });

    const cognitoAuthPolicy = new iam.CfnPolicy(this, 'CognitoAuthPolicy', {
      policyName: props.authPolicyName!,
      roles: [props.authRoleName!],
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['kinesis:PutRecord', 'kinesis:PutRecords'],
            Resource: kinesisStream.attrArn,
          },
        ],
      },
    });

    const cognitoUnauthPolicy = new iam.CfnPolicy(this, 'CognitoUnauthPolicy', {
      policyName: props.unauthPolicyName!,
      roles: [props.unauthRoleName!],
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['kinesis:PutRecord', 'kinesis:PutRecords'],
            Resource: kinesisStream.attrArn,
          },
        ],
      },
    });

    // Outputs
    this.kinesisStreamArn = kinesisStream.attrArn;
    new cdk.CfnOutput(this, 'CfnOutputkinesisStreamArn', {
      key: 'kinesisStreamArn',
      value: this.kinesisStreamArn!.toString(),
    });
    this.kinesisStreamId = kinesisStream.ref;
    new cdk.CfnOutput(this, 'CfnOutputkinesisStreamId', {
      key: 'kinesisStreamId',
      value: this.kinesisStreamId!.toString(),
    });
    this.kinesisStreamShardCount = props.kinesisStreamShardCount!;
    new cdk.CfnOutput(this, 'CfnOutputkinesisStreamShardCount', {
      key: 'kinesisStreamShardCount',
      value: this.kinesisStreamShardCount!.toString(),
    });
  }
}
