// eslint-disable-next-line import/no-extraneous-dependencies
import {
  $TSContext, AmplifyCategories, AmplifySupportedService, CloudformationProviderFacade,
} from 'amplify-cli-core';
import aws from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import { AmplifyStudioClient } from '../clients';
import { shouldRenderComponents } from '../commands/utils/shouldRenderComponents';

const awsMock = aws as any;

jest.mock('amplify-cli-core', () => ({
  ...jest.requireActual('amplify-cli-core'),
  stateManager: {
    getMeta: jest.fn(() => ({
      [AmplifyCategories.API]: {
        MyResourceName: {
          service: AmplifySupportedService.APPSYNC,
        },
      },
    })),
    // eslint-disable-next-line spellcheck/spell-checker
    getCLIJSON: jest.fn().mockReturnValue({ features: { graphqltransformer: { transformerversion: 2 } } }),
    setCLIJSON: jest.fn(),
  },
  FeatureFlags: {
    getBoolean: () => true,
    getNumber: jest.fn().mockReturnValue(2),
    reloadValues: jest.fn(),
  },
}));
CloudformationProviderFacade.isAmplifyAdminApp = jest.fn().mockReturnValue({
  isAdminApp: true,
});

describe('should render components', () => {
  let context: $TSContext | any;
  let client: AmplifyStudioClient;

  beforeAll(async () => {
    // set metadata response
    awsMock.AmplifyUIBuilder = jest.fn(() => ({
      getMetadata: jest.fn(() => ({
        promise: jest.fn(() => ({
          features: {
            autoGenerateForms: 'true',
            autoGenerateViews: 'true',
          },
        })),
      })),
    }));
    context = {
      amplify: {
        invokePluginMethod: () => ({}),
      },
      input: {
        options: {
          'no-codegen': false,
          appId: 'testAppId',
          envName: 'testEnvName',
        },
      },
      exeInfo: {
        projectConfig: {
          providers: ['awscloudformation'],
          frontend: 'javascript',
          javascript: {
            framework: 'react',
          },
        },
      },
    };

    client = await AmplifyStudioClient.setClientInfo(context);
  });
  it('works with a valid config', async () => {
    const shouldIt = await shouldRenderComponents(context, client);
    expect(shouldIt).toBe(true);
  });
  it("doesn't work if --no-codegen flag is set", async () => {
    context.input.options['no-codegen'] = true;
    const shouldIt = await shouldRenderComponents(context, client);
    expect(shouldIt).toBe(false);
  });
  it("doesn't work if provider is not awscloudformation", async () => {
    context.exeInfo.projectConfig.providers = [];
    const shouldIt = await shouldRenderComponents(context, client);
    expect(shouldIt).toBe(false);
  });
  it('should return false if frontend is ios', async () => {
    context.exeInfo.projectConfig.frontend = 'ios';
    const shouldIt = await shouldRenderComponents(context, client);
    expect(shouldIt).toBe(false);
  });
  it('should return false if frontend is vue', async () => {
    context.exeInfo.projectConfig.javascript.framework = 'vue';
    const shouldIt = await shouldRenderComponents(context, client);
    expect(shouldIt).toBe(false);
  });
});
