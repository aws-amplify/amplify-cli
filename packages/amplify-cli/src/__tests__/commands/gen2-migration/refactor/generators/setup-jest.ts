import { toBeACloudFormationCommand } from './custom-test-matchers';
import { DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';

// Mock snap module to avoid filesystem writes during tests
jest.mock('../../../../../commands/gen2-migration/refactor/snap', () => ({
  preUpdateStack: jest.fn(),
  preRefactorStack: jest.fn(),
  OUTPUT_DIRECTORY: '.amplify/refactor.operations',
}));

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
