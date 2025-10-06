import { mockClient } from 'aws-sdk-client-mock';
import { AmplifyUIBuilderClient, GetMetadataCommand } from '@aws-sdk/client-amplifyuibuilder';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { shouldRenderComponents } from '../commands/utils/shouldRenderComponents';

const amplifyUIBuilderMock = mockClient(AmplifyUIBuilderClient);

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  stateManager: {
    getProjectConfig: jest.fn().mockReturnValue({
      providers: ['awscloudformation'],
      frontend: 'javascript',
      javascript: {
        framework: 'react',
      },
    }),
  },
}));

jest.mock('../clients', () => ({
  AmplifyStudioClient: {
    isAmplifyApp: jest.fn().mockReturnValue(true),
  },
}));

describe('should render components', () => {
  let context: $TSContext | any;

  beforeAll(async () => {
    amplifyUIBuilderMock.on(GetMetadataCommand).resolves({
      features: {
        autoGenerateForms: 'true',
        autoGenerateViews: 'true',
        formFeatureFlags: {
          isRelationshipSupported: 'false',
          isNonModelSupported: 'false',
        },
      },
    });
    context = {
      input: {
        options: {
          'no-codegen': false,
          appId: 'testAppId',
          envName: 'testEnvName',
        },
      },
    };
  });

  it('works with a valid config', async () => {
    const shouldIt = await shouldRenderComponents(context);
    expect(shouldIt).toBe(true);
  });

  it("doesn't work if --no-codegen flag is set", async () => {
    context.input.options['no-codegen'] = true;
    const shouldIt = await shouldRenderComponents(context);
    expect(shouldIt).toBe(false);
  });

  it("doesn't work if provider is not awscloudformation", async () => {
    jest.mock('@aws-amplify/amplify-cli-core', () => ({
      stateManager: {
        getProjectConfig: jest.fn().mockReturnValue({
          providers: [],
          frontend: 'javascript',
          javascript: {
            framework: 'react',
          },
        }),
      },
    }));
    const shouldIt = await shouldRenderComponents(context);
    expect(shouldIt).toBe(false);
  });

  it('should return false if frontend is ios', async () => {
    jest.mock('@aws-amplify/amplify-cli-core', () => ({
      stateManager: {
        getProjectConfig: jest.fn().mockReturnValue({
          providers: [],
          frontend: 'ios',
        }),
      },
    }));
    const shouldIt = await shouldRenderComponents(context);
    expect(shouldIt).toBe(false);
  });

  it('should return false if frontend is vue', async () => {
    jest.mock('@aws-amplify/amplify-cli-core', () => ({
      stateManager: {
        getProjectConfig: jest.fn().mockReturnValue({
          providers: [],
          frontend: 'javascript',
          javascript: {
            framework: 'vue',
          },
        }),
      },
    }));
    const shouldIt = await shouldRenderComponents(context);
    expect(shouldIt).toBe(false);
  });
});
