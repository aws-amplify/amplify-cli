import { tryRefactorStack, RefactorFailure } from '../../../../commands/gen2-migration/refactor/cfn-stack-refactor-updater';
import { mockClient } from 'aws-sdk-client-mock';
import {
  CloudFormationClient,
  CreateStackRefactorCommand,
  DescribeStackRefactorCommand,
  ExecuteStackRefactorCommand,
  DescribeStacksCommand,
  StackRefactorStatus,
  StackRefactorExecutionStatus,
} from '@aws-sdk/client-cloudformation';

jest.mock('../../../../commands/gen2-migration/refactor/snap', () => ({
  preRefactorStack: jest.fn(),
}));

const input = {
  StackDefinitions: [
    { StackName: 'source-stack', TemplateBody: '{}' },
    { StackName: 'dest-stack', TemplateBody: '{}' },
  ],
  ResourceMappings: [
    { Source: { StackName: 'source-stack', LogicalResourceId: 'A' }, Destination: { StackName: 'dest-stack', LogicalResourceId: 'B' } },
  ],
};

describe('tryRefactorStack', () => {
  let cfnMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('happy path: create → execute → poll stacks → success', async () => {
    cfnMock.on(CreateStackRefactorCommand).resolves({ StackRefactorId: 'refactor-1' });
    cfnMock
      .on(DescribeStackRefactorCommand)
      .resolvesOnce({ Status: StackRefactorStatus.CREATE_COMPLETE })
      .resolvesOnce({ ExecutionStatus: StackRefactorExecutionStatus.EXECUTE_COMPLETE });
    cfnMock.on(ExecuteStackRefactorCommand).resolves({});
    cfnMock
      .on(DescribeStacksCommand)
      .resolvesOnce({ Stacks: [{ StackName: 'source-stack', StackStatus: 'UPDATE_COMPLETE', CreationTime: new Date() }] })
      .resolvesOnce({ Stacks: [{ StackName: 'dest-stack', StackStatus: 'UPDATE_COMPLETE', CreationTime: new Date() }] });

    const result = await tryRefactorStack(new CloudFormationClient({}), input, 1);
    expect(result.success).toBe(true);
  });

  it('returns failure when create lands on CREATE_FAILED', async () => {
    cfnMock.on(CreateStackRefactorCommand).resolves({ StackRefactorId: 'refactor-1' });
    cfnMock.on(DescribeStackRefactorCommand).resolves({
      Status: StackRefactorStatus.CREATE_FAILED,
      StatusReason: 'Update operations not permitted',
    });

    const result = await tryRefactorStack(new CloudFormationClient({}), input, 1);
    expect(result.success).toBe(false);
    if (!result.success) {
      const failure = result as RefactorFailure;
      expect(failure.reason).toContain('Update operations not permitted');
      expect(failure.stackRefactorId).toBe('refactor-1');
    }
  });

  it('returns failure when execute lands on EXECUTE_FAILED', async () => {
    cfnMock.on(CreateStackRefactorCommand).resolves({ StackRefactorId: 'refactor-1' });
    cfnMock
      .on(DescribeStackRefactorCommand)
      .resolvesOnce({ Status: StackRefactorStatus.CREATE_COMPLETE })
      .resolvesOnce({ ExecutionStatus: StackRefactorExecutionStatus.EXECUTE_FAILED, ExecutionStatusReason: 'conflict' });
    cfnMock.on(ExecuteStackRefactorCommand).resolves({});

    const result = await tryRefactorStack(new CloudFormationClient({}), input, 1);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect((result as RefactorFailure).reason).toContain('conflict');
    }
  });

  it('throws on polling timeout', async () => {
    jest.useFakeTimers();
    cfnMock.on(CreateStackRefactorCommand).resolves({ StackRefactorId: 'refactor-1' });
    cfnMock.on(DescribeStackRefactorCommand).resolves({ Status: StackRefactorStatus.CREATE_IN_PROGRESS });

    let error: Error | undefined;
    const promise = tryRefactorStack(new CloudFormationClient({}), input, 1).catch((e) => {
      error = e;
    });
    // Flush all pending timers
    await jest.runAllTimersAsync();
    await promise;
    expect(error?.message).toContain('did not reach a completion state');
    jest.useRealTimers();
  });

  it('throws when CreateStackRefactor returns no StackRefactorId', async () => {
    cfnMock.on(CreateStackRefactorCommand).resolves({});

    await expect(tryRefactorStack(new CloudFormationClient({}), input, 1)).rejects.toThrow('no StackRefactorId');
  });
});
