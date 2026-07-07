import { getSuitableFrontend } from '../../init-steps/s1-initFrontend';

describe('getSuitableFrontend', () => {
  it('supports headless inputs', () => {
    const context = {
      exeInfo: {
        inputParams: {
          amplify: {
            frontend: 'ios',
          },
        },
      },
    } as any;
    const frontendPlugins = { ios: '' } as any;
    const result = getSuitableFrontend(context, frontendPlugins, '');
    expect(result).toStrictEqual('ios');
  });
});
