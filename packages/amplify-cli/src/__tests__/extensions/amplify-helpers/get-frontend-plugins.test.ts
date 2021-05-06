import { getFrontendPlugins } from '../../../extensions/amplify-helpers/get-frontend-plugins';

describe('get-frontend-plugins', () => {
  it('returns map of frontend plugins when frontend plugin exists', () => {
    const context = {
      runtime: {
        plugins: [
          {
            name: 'amplify-frontend-javascript',
            pluginType: 'frontend',
            pluginName: 'javascript',
            directory: '/home/user/amplify/lib/@aws-amplify/cli/node_modules/amplify-frontend-javascript',
          },
          {
            name: 'amplify-frontend-flutter',
            pluginType: 'frontend',
            pluginName: 'flutter',
            directory: '/home/user/amplify/lib/@aws-amplify/cli/node_modules/amplify-frontend-flutter',
          },
          {
            name: 'amplify-category-auth',
            pluginType: 'category',
            pluginName: 'auth',
            directory: '/home/user/amplify/lib/@aws-amplify/cli/node_modules/amplify-category-auth',
          },
        ],
      },
    };
    const plugins = getFrontendPlugins(context as any);
    expect(plugins).toEqual({
      javascript: '/home/user/amplify/lib/@aws-amplify/cli/node_modules/amplify-frontend-javascript',
      flutter: '/home/user/amplify/lib/@aws-amplify/cli/node_modules/amplify-frontend-flutter',
    });
  });

  it('throw error when no frontend plugin exists', () => {
    const context = {
      print: {
        info: jest.fn(),
        error: jest.fn(),
      },
      runtime: {
        plugins: [
          {
            name: 'amplify-category-auth',
            pluginType: 'category',
            pluginName: 'auth',
            directory: '/home/user/amplify/lib/@aws-amplify/cli/node_modules/amplify-category-auth',
          },
        ],
      },
    };
    expect(() => getFrontendPlugins(context as any)).toThrowError("Can't find any frontend plugins configured for the CLI.");

    expect(context.print.error).toBeCalledWith("Can't find any frontend plugins configured for the CLI.");
    expect(context.print.info).toBeCalledWith("Run 'amplify plugin scan' to scan your system for plugins.");
  });
});
