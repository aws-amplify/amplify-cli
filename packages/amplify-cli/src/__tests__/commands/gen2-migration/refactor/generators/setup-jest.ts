import { toBeACloudFormationCommand } from './custom-test-matchers';
import { DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';

// Mock AWS SDK config loading
jest.mock('@smithy/shared-ini-file-loader', () => ({
  loadSharedConfigFiles: jest.fn().mockResolvedValue({
    configFile: { default: {} },
    credentialsFile: { default: {} },
  }),
  getProfileName: jest.fn().mockReturnValue('default'),
}));

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
