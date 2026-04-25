import {
  AnalyticsRenderer,
  AnalyticsRenderOptions,
} from '../../../../../../commands/gen2-migration/generate/amplify/analytics/kinesis.renderer';
import { DiscoveredResource } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';
import { TS } from '../../../../../../commands/gen2-migration/generate/_infra/ts';

describe('AnalyticsRenderer', () => {
  function createRenderer(resourceName: string): AnalyticsRenderer {
    const mockResource: DiscoveredResource = {
      category: 'analytics',
      resourceName,
      service: 'Kinesis',
      key: `analytics:Kinesis`,
    };
    return new AnalyticsRenderer(mockResource);
  }

  function render(renderer: AnalyticsRenderer, opts: AnalyticsRenderOptions): string {
    return TS.printNodes(renderer.render(opts));
  }

  it('renders a basic analytics resource with construct and export', () => {
    const renderer = createRenderer('todoKinesis');
    const output = render(renderer, {
      constructClassName: 'analyticsTodoKinesis',
      constructFileName: 'todoKinesis-construct',
      shardCount: 1,
      streamName: 'todoKinesis-stream-abc123',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { CfnStream } from 'aws-cdk-lib/aws-kinesis';
      import { analyticsTodoKinesis } from './todoKinesis-construct';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export function defineAnalytics(backend: Backend) {
        const stack = backend.createStack('analytics');
        const analytics = new analyticsTodoKinesis(stack, 'TodoKinesis', {
          kinesisStreamName: 'todoKinesis',
          kinesisStreamShardCount: 1,
          authPolicyName: \`todoKinesis-auth-policy-\${branchName}\`,
          unauthPolicyName: \`todoKinesis-unauth-policy-\${branchName}\`,
          authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
          unauthRoleName: backend.auth.resources.unauthenticatedUserIamRole.roleName,
          branchName,
        });
        return analytics;
      }

      export function postRefactor(analytics: analyticsTodoKinesis) {
        (analytics.node.findChild('KinesisStream') as CfnStream).name =
          'todoKinesis-stream-abc123';
      }
      "
    `);
  });

  it('renders construct instantiation with higher shard count', () => {
    const renderer = createRenderer('myStream');
    const output = render(renderer, {
      constructClassName: 'analyticsMyStream',
      constructFileName: 'myStream-construct',
      shardCount: 3,
      streamName: 'myStream-abc',
    });

    expect(output).toMatchInlineSnapshot(`
      "import { CfnStream } from 'aws-cdk-lib/aws-kinesis';
      import { analyticsMyStream } from './myStream-construct';
      import type { Backend } from '../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export function defineAnalytics(backend: Backend) {
        const stack = backend.createStack('analytics');
        const analytics = new analyticsMyStream(stack, 'MyStream', {
          kinesisStreamName: 'myStream',
          kinesisStreamShardCount: 3,
          authPolicyName: \`myStream-auth-policy-\${branchName}\`,
          unauthPolicyName: \`myStream-unauth-policy-\${branchName}\`,
          authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
          unauthRoleName: backend.auth.resources.unauthenticatedUserIamRole.roleName,
          branchName,
        });
        return analytics;
      }

      export function postRefactor(analytics: analyticsMyStream) {
        (analytics.node.findChild('KinesisStream') as CfnStream).name =
          'myStream-abc';
      }
      "
    `);
  });
});
