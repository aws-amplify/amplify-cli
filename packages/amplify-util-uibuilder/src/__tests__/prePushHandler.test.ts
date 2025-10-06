import { ExportFormsCommand, GetMetadataCommand } from '@aws-sdk/client-amplifyuibuilder';
import { Form } from '@aws-sdk/client-amplifyuibuilder';
import { printer } from '@aws-amplify/amplify-prompts'; // eslint-disable-line import/no-extraneous-dependencies
import * as utils from '../commands/utils';
import { prePushHandler } from '../utils/prePushHandler';
import { isDataStoreEnabled } from '@aws-amplify/amplify-category-api';

jest.mock('../commands/utils');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('../commands/utils/featureFlags', () => ({
  getTransformerVersion: jest.fn().mockImplementation(() => 2),
}));
jest.mock('@aws-amplify/amplify-category-api', () => ({
  ...jest.requireActual('@aws-amplify/amplify-category-api'),
  isDataStoreEnabled: jest.fn(),
}));

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-amplifyuibuilder', () => ({
  ...jest.requireActual('@aws-sdk/client-amplifyuibuilder'),
  AmplifyUIBuilderClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
}));

const utilsMock = utils as any;
const isDataStoreEnabledMocked = jest.mocked(isDataStoreEnabled);

utilsMock.shouldRenderComponents = jest.fn().mockImplementation(() => true);

describe('handlePrePush', () => {
  let context: any;
  let exportedForms: Form[];

  beforeEach(() => {
    mockSend.mockReset();
    isDataStoreEnabledMocked.mockResolvedValue(true);
    context = {
      amplify: {
        invokePluginMethod: jest.fn().mockResolvedValue({ models: { Comment: {} } }),
      },
      input: {
        options: {
          appId: 'testAppId',
          envName: 'testEnvName',
        },
      },
    };

    exportedForms = [
      {
        name: 'BlogCreateForm',
        formActionType: 'create',
        fields: {},
        style: {},
        schemaVersion: '1.0',
        sectionalElements: {},
        appId: '1234',
        environmentName: 'staging',
        dataType: {
          dataSourceType: 'DataStore',
          dataTypeName: 'Blog',
        },
        id: '12345',
      },
      {
        name: 'BlogUpdateForm',
        formActionType: 'update',
        fields: {},
        style: {},
        schemaVersion: '1.0',
        sectionalElements: {},
        appId: '1234',
        environmentName: 'staging',
        dataType: {
          dataSourceType: 'DataStore',
          dataTypeName: 'Blog',
        },
        id: '12345',
      },
    ];

    mockSend.mockImplementation((command) => {
      if (command instanceof ExportFormsCommand) {
        return Promise.resolve({ entities: exportedForms });
      }
      if (command instanceof GetMetadataCommand) {
        return Promise.resolve({
          features: {
            autoGenerateForms: 'true',
            autoGenerateViews: 'true',
            formFeatureFlags: {
              isRelationshipSupported: 'false',
              isNonModelSupported: 'false',
            },
          },
        });
      }
      return Promise.resole({});
    });
  });

  it('runs handlePrePush', async () => {
    utilsMock.isFormDetachedFromModel = jest.fn().mockReturnValue(true);
    utilsMock.isFormSchemaCustomized = jest.fn().mockReturnValue(true);
    const spy = jest.spyOn(printer, 'warn');
    await prePushHandler(context);
    expect(spy).toHaveBeenCalledWith(
      'The following forms will no longer be available because the connected data model no longer exists: BlogCreateForm, BlogUpdateForm',
    );
  });

  it('runs handlePrePush without schema', async () => {
    context.amplify.invokePluginMethod = jest.fn().mockResolvedValue(null);
    const spy = jest.spyOn(printer, 'debug');
    await prePushHandler(context);
    expect(spy).toHaveBeenCalledWith('Local schema not found');
  });
});
