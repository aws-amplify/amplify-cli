import {
  AnalyticsRenderer,
  RenderDefineAnalyticsOptions,
} from '../../../../../../commands/gen2-migration/generate-new/amplify/analytics/kinesis.renderer';
import { TS } from '../../../../../../commands/gen2-migration/generate-new/_infra/ts';

describe('AnalyticsRenderer', () => {
  const renderer = new AnalyticsRenderer();

  function render(opts: RenderDefineAnalyticsOptions): string {
    return TS.printNodes(renderer.render(opts));
  }

  it('renders a basic analytics resource with construct and export', () => {
    const output = render({
      constructClassName: 'analyticsTodoKinesis',
      constructFileName: 'todoKinesis-construct',
      resourceName: 'todoKinesis',
      shardCount: 1,
      streamName: 'todoKinesis-stream-abc123',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { CfnStream } from 'aws-cdk-lib/aws-kinesis';
      import { analyticsTodoKinesis } from './todoKinesis-construct';
      import { Backend } from '@aws-amplify/backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const defineAnalytics = (backend: Backend<any>) => {
        const analyticsStack = backend.createStack('analytics');
        const analytics = new analyticsTodoKinesis(analyticsStack, 'todoKinesis', {
          kinesisStreamName: 'todoKinesis',
          kinesisStreamShardCount: 1,
          authPolicyName: \`todoKinesis-auth-policy-\${branchName}\`,
          unauthPolicyName: \`todoKinesis-unauth-policy-\${branchName}\`,
          authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
          unauthRoleName: backend.auth.resources.unauthenticatedUserIamRole.roleName,
          branchName,
        });
        //Use this kinesis stream name post-refactor
        //(analytics.node.findChild('KinesisStream') as CfnStream).name = "todoKinesis-stream-abc123"
        return analytics;
      };
      "
    `);
  });

  it('renders construct instantiation with higher shard count', () => {
    const output = render({
      constructClassName: 'analyticsMyStream',
      constructFileName: 'myStream-construct',
      resourceName: 'myStream',
      shardCount: 3,
      streamName: 'myStream-abc',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { CfnStream } from 'aws-cdk-lib/aws-kinesis';
      import { analyticsMyStream } from './myStream-construct';
      import { Backend } from '@aws-amplify/backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export const defineAnalytics = (backend: Backend<any>) => {
        const analyticsStack = backend.createStack('analytics');
        const analytics = new analyticsMyStream(analyticsStack, 'myStream', {
          kinesisStreamName: 'myStream',
          kinesisStreamShardCount: 3,
          authPolicyName: \`myStream-auth-policy-\${branchName}\`,
          unauthPolicyName: \`myStream-unauth-policy-\${branchName}\`,
          authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
          unauthRoleName: backend.auth.resources.unauthenticatedUserIamRole.roleName,
          branchName,
        });
        //Use this kinesis stream name post-refactor
        //(analytics.node.findChild('KinesisStream') as CfnStream).name = "myStream-abc"
        return analytics;
      };
      "
    `);
  });
});
