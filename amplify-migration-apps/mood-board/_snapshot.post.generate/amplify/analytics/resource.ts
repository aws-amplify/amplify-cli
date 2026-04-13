import { CfnStream } from 'aws-cdk-lib/aws-kinesis';
import { analyticsmoodboardKinesis } from './moodboardKinesis-construct';
import { Backend } from '@aws-amplify/backend';
import { CfnResource } from 'aws-cdk-lib';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const defineAnalytics = (backend: Backend<any>) => {
  const analyticsStack = backend.createStack('analytics');
  const analytics = new analyticsmoodboardKinesis(
    analyticsStack,
    'moodboardKinesis',
    {
      kinesisStreamName: 'moodboardKinesis',
      kinesisStreamShardCount: 1,
      authPolicyName: `moodboardKinesis-auth-policy-${branchName}`,
      unauthPolicyName: `moodboardKinesis-unauth-policy-${branchName}`,
      authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
      unauthRoleName:
        backend.auth.resources.unauthenticatedUserIamRole.roleName,
      branchName,
    }
  );
  for (const cfnResource of analyticsStack.node
    .findAll()
    .filter((n) => CfnResource.isCfnResource(n))) {
    if (cfnResource.cfnResourceType === 'AWS::Kinesis::Stream') {
      cfnResource.addOverride('DeletionPolicy', 'Retain');
      cfnResource.addOverride('UpdateReplacePolicy', 'Retain');
    }
  }
  //Use this kinesis stream name post-refactor
  //(analytics.node.findChild('KinesisStream') as CfnStream).name = "moodboardKinesis-main"
  return analytics;
};
