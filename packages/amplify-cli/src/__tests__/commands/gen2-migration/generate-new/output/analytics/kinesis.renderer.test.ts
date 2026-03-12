import {
  AnalyticsRenderer,
  RenderDefineAnalyticsOptions,
} from '../../../../../../commands/gen2-migration/generate-new/output/analytics/kinesis.renderer';
import { printNodes } from '../../../../../../commands/gen2-migration/generate-new/ts-writer';

describe('AnalyticsRenderer', () => {
  const renderer = new AnalyticsRenderer();

  it('renders a basic analytics resource with construct and export', () => {
    const opts: RenderDefineAnalyticsOptions = {
      constructClassName: 'analyticsTodoKinesis',
      constructFileName: 'todoKinesis-construct',
      resourceName: 'todoKinesis',
      shardCount: 1,
      streamName: 'todoKinesis-stream-abc123',
    };
    const nodes = renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('export const defineAnalytics');
    expect(output).toContain('analyticsTodoKinesis');
    expect(output).toContain("from './todoKinesis-construct'");
    expect(output).toContain("from 'aws-cdk-lib/aws-kinesis'");
    expect(output).toContain("from '@aws-amplify/backend'");
    expect(output).toContain('Backend');
  });

  it('renders construct instantiation with resource name and shard count', () => {
    const opts: RenderDefineAnalyticsOptions = {
      constructClassName: 'analyticsMyStream',
      constructFileName: 'myStream-construct',
      resourceName: 'myStream',
      shardCount: 3,
      streamName: 'myStream-abc',
    };
    const nodes = renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain("kinesisStreamName: 'myStream'");
    expect(output).toContain('kinesisStreamShardCount: 3');
  });

  it('renders auth and unauth policy names with branch variable', () => {
    const opts: RenderDefineAnalyticsOptions = {
      constructClassName: 'analyticsKinesis',
      constructFileName: 'kinesis-construct',
      resourceName: 'myKinesis',
      shardCount: 1,
      streamName: 'myKinesis-stream',
    };
    const nodes = renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('authPolicyName');
    expect(output).toContain('myKinesis-auth-policy-');
    expect(output).toContain('unauthPolicyName');
    expect(output).toContain('myKinesis-unauth-policy-');
    expect(output).toContain('branchName');
  });

  it('renders auth and unauth role name access from backend', () => {
    const opts: RenderDefineAnalyticsOptions = {
      constructClassName: 'analyticsKinesis',
      constructFileName: 'kinesis-construct',
      resourceName: 'myKinesis',
      shardCount: 1,
      streamName: 'myKinesis-stream',
    };
    const nodes = renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('backend.auth.resources.authenticatedUserIamRole.roleName');
    expect(output).toContain('backend.auth.resources.unauthenticatedUserIamRole.roleName');
  });

  it('renders analytics stack creation', () => {
    const opts: RenderDefineAnalyticsOptions = {
      constructClassName: 'analyticsKinesis',
      constructFileName: 'kinesis-construct',
      resourceName: 'myKinesis',
      shardCount: 1,
      streamName: 'myKinesis-stream',
    };
    const nodes = renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain("backend.createStack('analytics')");
    expect(output).toContain('analyticsStack');
  });

  it('renders post-refactor stream name comment', () => {
    const opts: RenderDefineAnalyticsOptions = {
      constructClassName: 'analyticsKinesis',
      constructFileName: 'kinesis-construct',
      resourceName: 'myKinesis',
      shardCount: 1,
      streamName: 'myKinesis-stream-abc123',
    };
    const nodes = renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('Use this kinesis stream name post-refactor');
    expect(output).toContain('myKinesis-stream-abc123');
  });

  it('renders CfnStream import', () => {
    const opts: RenderDefineAnalyticsOptions = {
      constructClassName: 'analyticsKinesis',
      constructFileName: 'kinesis-construct',
      resourceName: 'myKinesis',
      shardCount: 1,
      streamName: 'myKinesis-stream',
    };
    const nodes = renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('CfnStream');
  });

  it('renders branchName declaration', () => {
    const opts: RenderDefineAnalyticsOptions = {
      constructClassName: 'analyticsKinesis',
      constructFileName: 'kinesis-construct',
      resourceName: 'myKinesis',
      shardCount: 1,
      streamName: 'myKinesis-stream',
    };
    const nodes = renderer.render(opts);
    const output = printNodes(nodes);

    expect(output).toContain('const branchName');
  });
});
