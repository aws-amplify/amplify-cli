import { CfnStream } from 'aws-cdk-lib/aws-kinesis';
import { analyticsmoodboardKinesis } from './moodboardKinesis-construct';
import { Backend } from '../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const defineAnalytics = (backend: Backend) => {
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
  return analytics;
};

export function postRefactor(analytics: analyticsmoodboardKinesis) {
  (analytics.node.findChild('KinesisStream') as CfnStream).name = 'moodboardKinesis-x';
}
