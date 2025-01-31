import { verifyInput } from '../input-manager';
import { PluginInfo, PluginManifest, PluginPlatform, getPackageManager, getPackageManagerByType } from '@aws-amplify/amplify-cli-core';
import { CLIInput as CommandLineInput } from '../domain/command-input';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
  getPackageManager: jest.fn(),
}));

const npmPackageManager = getPackageManagerByType('npm');
const yarnPackageManager = getPackageManagerByType('yarn');
const pnpmPackageManager = getPackageManagerByType('pnpm');

describe('input validation tests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('status -v option should be treated as verbose', async () => {
    const input = new CommandLineInput(['status', '-v']);
    input.command = 'status';
    input.options = { v: true };

    await verifyInput(new PluginPlatform(), input);
    expect(input?.options?.verbose).toBe(true);
  });

  it('display npx Amplify Gen 2 message with command not found message', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(npmPackageManager);
    const input = new CommandLineInput(['sandbox']);
    input.command = 'sandbox';

    const version = 'latestVersion';
    const pluginPlatform = new PluginPlatform();
    pluginPlatform.plugins.core = [new PluginInfo('', version, '', new PluginManifest('', ''))];

    const verifyInputResult = await verifyInput(pluginPlatform, input);
    expect(verifyInputResult.message).toContain('can NOT find command');
    expect(verifyInputResult.message).toContain('npx @aws-amplify/backend-cli sandbox');
  });

  it('display yarn dlx Amplify Gen 2 message with command not found message', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const input = new CommandLineInput(['sandbox']);
    input.command = 'sandbox';

    const version = 'latestVersion';
    const pluginPlatform = new PluginPlatform();
    pluginPlatform.plugins.core = [new PluginInfo('', version, '', new PluginManifest('', ''))];

    const verifyInputResult = await verifyInput(pluginPlatform, input);
    expect(verifyInputResult.message).toContain('can NOT find command');
    expect(verifyInputResult.message).toContain('yarn dlx @aws-amplify/backend-cli sandbox');
  });

  it('display pnpm dlx Amplify Gen 2 message with command not found message', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(pnpmPackageManager);
    const input = new CommandLineInput(['sandbox']);
    input.command = 'sandbox';

    const version = 'latestVersion';
    const pluginPlatform = new PluginPlatform();
    pluginPlatform.plugins.core = [new PluginInfo('', version, '', new PluginManifest('', ''))];

    const verifyInputResult = await verifyInput(pluginPlatform, input);
    expect(verifyInputResult.message).toContain('can NOT find command');
    expect(verifyInputResult.message).toContain('pnpm dlx @aws-amplify/backend-cli sandbox');
  });
});
