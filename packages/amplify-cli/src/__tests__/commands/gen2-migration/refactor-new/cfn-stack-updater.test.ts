import { tryUpdateStack, pollStackForCompletionState } from '../../../../commands/gen2-migration/refactor-new/cfn-stack-updater';
import { mockClient } from 'aws-sdk-client-mock';
import { CloudFormationClient, UpdateStackCommand, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { CFNTemplate } from '../../../../commands/gen2-migration/cfn-template';

jest.mock('../../../../commands/gen2-migration/refactor-new/snap', () => ({
  preUpdateStack: jest.fn(),
}));

const template: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'test',
  Resources: { Bucket: { Type: 'AWS::S3::Bucket', Properties: {} } },
  Outputs: {},
};

describe('tryUpdateStack', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('updates stack and returns completion status', async () => {
    cfnMock.on(UpdateStackCommand).resolves({});
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 'my-stack', StackStatus: 'UPDATE_COMPLETE', CreationTime: new Date() }],
    });

    const result = await tryUpdateStack({
      cfnClient: new CloudFormationClient({}),
      stackName: 'my-stack',
      parameters: [],
      templateBody: template,
      attempts: 1,
    });
    expect(result).toBe('UPDATE_COMPLETE');
  });

  it('returns UPDATE_COMPLETE without polling when no updates needed', async () => {
    cfnMock.on(UpdateStackCommand).rejects({ message: 'No updates are to be performed' });

    const result = await tryUpdateStack({
      cfnClient: new CloudFormationClient({}),
      stackName: 'my-stack',
      parameters: [],
      templateBody: template,
    });
    expect(result).toBe('UPDATE_COMPLETE');
    expect(cfnMock.commandCalls(DescribeStacksCommand)).toHaveLength(0);
  });

  it('rethrows non-no-update errors', async () => {
    cfnMock.on(UpdateStackCommand).rejects(new Error('Template format error'));

    await expect(
      tryUpdateStack({
        cfnClient: new CloudFormationClient({}),
        stackName: 'my-stack',
        parameters: [],
        templateBody: template,
      }),
    ).rejects.toThrow('Template format error');
  });
});

describe('pollStackForCompletionState', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('returns immediately when stack is already complete', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 's', StackStatus: 'UPDATE_COMPLETE', CreationTime: new Date() }],
    });

    const result = await pollStackForCompletionState(new CloudFormationClient({}), 's', 1);
    expect(result).toBe('UPDATE_COMPLETE');
    expect(cfnMock.commandCalls(DescribeStacksCommand)).toHaveLength(1);
  });

  it('polls through in-progress states until completion', async () => {
    jest.useFakeTimers();
    cfnMock
      .on(DescribeStacksCommand)
      .resolvesOnce({ Stacks: [{ StackName: 's', StackStatus: 'UPDATE_IN_PROGRESS', CreationTime: new Date() }] })
      .resolvesOnce({ Stacks: [{ StackName: 's', StackStatus: 'UPDATE_COMPLETE', CreationTime: new Date() }] });

    let result: string | undefined;
    const promise = pollStackForCompletionState(new CloudFormationClient({}), 's', 2).then((r) => {
      result = r;
    });
    await jest.runAllTimersAsync();
    await promise;

    expect(result).toBe('UPDATE_COMPLETE');
    expect(cfnMock.commandCalls(DescribeStacksCommand)).toHaveLength(2);
    jest.useRealTimers();
  });

  it('returns non-UPDATE_COMPLETE completion states', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 's', StackStatus: 'UPDATE_ROLLBACK_COMPLETE', CreationTime: new Date() }],
    });

    const result = await pollStackForCompletionState(new CloudFormationClient({}), 's', 1);
    expect(result).toBe('UPDATE_ROLLBACK_COMPLETE');
  });

  it('throws when stack not found during polling', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    await expect(pollStackForCompletionState(new CloudFormationClient({}), 'gone-stack', 1)).rejects.toThrow(
      "Stack 'gone-stack' not found while polling",
    );
  });

  it('throws when stack has no status', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 's', StackStatus: undefined, CreationTime: new Date() }],
    });

    await expect(pollStackForCompletionState(new CloudFormationClient({}), 's', 1)).rejects.toThrow('has no status');
  });

  it('throws on polling timeout', async () => {
    jest.useFakeTimers();
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 's', StackStatus: 'UPDATE_IN_PROGRESS', CreationTime: new Date() }],
    });

    let error: Error | undefined;
    const promise = pollStackForCompletionState(new CloudFormationClient({}), 's', 1).catch((e) => {
      error = e;
    });
    await jest.runAllTimersAsync();
    await promise;

    expect(error?.message).toContain('did not reach a completion state');
    expect(cfnMock.commandCalls(DescribeStacksCommand)).toHaveLength(1);
    jest.useRealTimers();
  });
});
