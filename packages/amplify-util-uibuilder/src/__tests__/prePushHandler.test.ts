// aws-sdk, amplify-cli-core, amplify-prompts are in package dependencies
import aws from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import { Form } from 'aws-sdk/clients/amplifyuibuilder'; // eslint-disable-line import/no-extraneous-dependencies
import { printer } from '@aws-amplify/amplify-prompts'; // eslint-disable-line import/no-extraneous-dependencies
import * as utils from '../commands/utils';
import { prePushHandler } from '../utils/prePushHandler';

jest.mock('../commands/utils');
jest.mock('amplify-cli-core');
jest.mock('../commands/utils/featureFlags', () => ({
  getTransformerVersion: jest.fn().mockImplementation(() => 2),
}));

const awsMock = aws as any;
const utilsMock = utils as any;

utilsMock.shouldRenderComponents = jest.fn().mockImplementation(() => true);

describe('handlePrePush', () => {
  let context: any;
  let mockedExport: jest.Mock<any, any>;
  let exportedForms: Form[];

  beforeEach(() => {
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

    mockedExport = jest.fn(() => ({
      entities: exportedForms,
    }));

    awsMock.AmplifyUIBuilder = jest.fn(() => ({
      exportForms: jest.fn(() => ({
        promise: () => mockedExport(),
      })),
      getMetadata: jest.fn(() => ({
        promise: jest.fn(() => ({
          features: {
            autoGenerateForms: 'true',
            autoGenerateViews: 'true',
          },
        })),
      })),
    }));
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
