import { PluginPlatform } from '../../../domain/plugin-platform';
import { PluginInfo } from '../../../domain/plugin-info';

export function constructMockPluginPlatform(): PluginPlatform {
  const mockPluginPlatform = new PluginPlatform();
  const corePluginInfo: PluginInfo = {
    packageName: '@aws-amplify/cli',
    packageVersion: '4.13.4',
    packageLocation: '/root/amplify-cli/packages/amplify-cli/',
    manifest: {
      name: 'core',
      type: 'core',
      commands: [
        'categories',
        'configure',
        'console',
        'delete',
        'env',
        'help',
        'init',
        'migrate',
        'publish',
        'push',
        'pull',
        'run',
        'status',
        'plugin',
        'version',
      ],
      commandAliases: {
        h: 'help',
        serve: 'run',
        ls: 'status',
      },
    },
  };
  const categoryHostingPluginInfo: PluginInfo = {
    packageName: 'amplify-category-hosting',
    packageVersion: '2.1.11',
    packageLocation: '/root/amplify-cli/packages/amplify-category-hosting',
    manifest: {
      name: 'hosting',
      displayName: 'Amazon CloudFront and S3',
      type: 'category',
      commands: ['add', 'configure', 'console', 'push', 'remove', 'help'],
      commandAliases: {
        enable: 'add',
        update: 'configure',
      },
      services: ['S3AndCloudFront'],
    },
  };
  const consoleHostingPluginInfo: PluginInfo = {
    packageName: 'amplify-console-hosting',
    packageVersion: '1.0.0',
    packageLocation: '/root/amplify-cli/packages/amplify-console-hosting',
    manifest: {
      name: 'hosting',
      type: 'category',
      commands: ['add', 'configure', 'remove', 'publish', 'help', 'status', 'serve'],
      commandAliases: {
        console: 'serve',
      },
      displayName: 'Hosting with Amplify Console (Managed hosting with custom domains, Continuous deployment)',
      services: ['amplifyhosting'],
    },
  };

  mockPluginPlatform.plugins.core = [corePluginInfo];
  mockPluginPlatform.plugins.hosting = [categoryHostingPluginInfo, consoleHostingPluginInfo];
  return mockPluginPlatform;
}

test('constructMockPluginPlatform', () => {
  const mockPluginPlatform = constructMockPluginPlatform();
  expect(mockPluginPlatform).toBeDefined();
});
