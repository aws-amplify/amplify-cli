import { expect } from '@jest/globals';
import { toBeACloudFormationCommand } from './custom-test-matchers';
import { DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';

expect.extend({
  toBeACloudFormationCommand,
});

it('sets up toBeACloudFormationCommand', () => {
  expect(
    toBeACloudFormationCommand(
      [new DescribeStackResourcesCommand({ StackName: 'stackName' })],
      { StackName: 'stackName' },
      DescribeStackResourcesCommand,
    ),
  ).toBeTruthy();
});
