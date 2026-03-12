import { getHoldingStackName, findHoldingStack } from '../../../../commands/gen2-migration/refactor-new/holding-stack';
import { mockClient } from 'aws-sdk-client-mock';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

describe('holding-stack', () => {
  describe('getHoldingStackName', () => {
    it('appends -holding after the hash suffix', () => {
      const name = getHoldingStackName('amplify-app-main-auth-ABCD1234');
      expect(name).toBe('amplify-app-main-auth-ABCD1234-holding');
    });

    it('truncates prefix when result would exceed 128 characters', () => {
      const longPrefix = 'a'.repeat(120);
      const stackId = `${longPrefix}-HASH1234`;
      const name = getHoldingStackName(stackId);
      expect(name.length).toBeLessThanOrEqual(128);
      expect(name).toContain('-HASH1234-holding');
    });
  });

  describe('findHoldingStack', () => {
    let cfnMock: ReturnType<typeof mockClient>;
    beforeEach(() => {
      cfnMock = mockClient(CloudFormationClient);
    });
    afterEach(() => cfnMock.restore());

    it('returns the stack when it exists', async () => {
      cfnMock.on(DescribeStacksCommand).resolves({
        Stacks: [{ StackName: 'holding', StackStatus: 'CREATE_COMPLETE', CreationTime: new Date() }],
      });
      const result = await findHoldingStack(new CloudFormationClient({}), 'holding');
      expect(result).not.toBeNull();
      expect(result?.StackName).toBe('holding');
    });

    it('returns null when stack does not exist (ValidationError)', async () => {
      // Mock returns empty stacks — findHoldingStack returns null
      cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });
      const result = await findHoldingStack(new CloudFormationClient({}), 'nonexistent');
      expect(result).toBeNull();
    });
  });
});
