import { CfnResource } from 'aws-cdk-lib';
import { CfnStream } from 'aws-cdk-lib/aws-kinesis';
import { MoodboardKinesis } from './moodboardkinesis-construct';
import type { Backend } from '../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export function defineAnalytics(backend: Backend) {
  const stack = backend.createStack('analytics');
  const analytics = new MoodboardKinesis(stack, 'MoodboardKinesis', {
    kinesisStreamName: 'moodboardKinesis',
    kinesisStreamShardCount: 1,
    authPolicyName: `moodboardKinesis-auth-policy-${branchName}`,
    unauthPolicyName: `moodboardKinesis-unauth-policy-${branchName}`,
    authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
    unauthRoleName: backend.auth.resources.unauthenticatedUserIamRole.roleName,
    branchName,
  });
  for (const cfnResource of stack.node
    .findAll()
    .filter(
      (c) =>
        CfnResource.isCfnResource(c) &&
        c.cfnResourceType === 'AWS::Kinesis::Stream'
    )) {
    (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
    (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
  }
  return analytics;
}

export function postRefactor(analytics: MoodboardKinesis) {
  (analytics.node.findChild('KinesisStream') as CfnStream).name =
    'moodboardKinesis-x';
}
