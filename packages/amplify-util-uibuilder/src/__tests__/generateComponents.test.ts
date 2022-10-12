import aws from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import { CloudformationProviderFacade } from 'amplify-cli-core';
import * as utils from '../commands/utils';
import { run } from '../commands/generateComponents';

jest.mock('../commands/utils');
jest.mock('amplify-cli-core');
const awsMock = aws as any;
const utilsMock = utils as any;

utilsMock.shouldRenderComponents = jest.fn().mockImplementation(() => true);
utilsMock.notifyMissingPackages = jest.fn().mockImplementation(() => true);
CloudformationProviderFacade.isAmplifyAdminApp = jest.fn().mockImplementation(() => ({
  isAdminApp: true,
}));
jest.mock('../commands/utils/featureFlags', () => ({
  getTransformerVersion: jest.fn().mockImplementation(() => 2)
}));

describe('can generate components', () => {
  let context: any;
  let schemas: any;
  let mockedExport: jest.Mock<any, any>;
  beforeEach(() => {
    context = {
      amplify: {
        invokePluginMethod: () => ({}),
      },
      input: {
        options: {
          appId: 'testAppId',
          envName: 'testEnvName',
        },
      },
    };
    schemas = {
      entities: [
        {
          resultType: 'SUCCESS',
          schemaName: 'testSchema',
          name: 'testSchema',
          schemaVersion: '1.0',
        },
      ],
    };
    mockedExport = jest.fn(() => ({
      entities: schemas.entities,
    }));
    awsMock.AmplifyUIBuilder = jest.fn(() => ({
      exportComponents: jest.fn(() => ({
        promise: () => mockedExport(),
      })),
      exportThemes: jest.fn(() => ({
        promise: () => mockedExport(),
      })),
      exportForms: jest.fn(() => ({
        promise: () => mockedExport(),
      })),
      exportViews: jest.fn(() => ({
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
    utilsMock.generateUiBuilderComponents = jest.fn().mockImplementation(() => schemas.entities);
    utilsMock.generateUiBuilderThemes = jest.fn().mockImplementation(() => schemas.entities);
    utilsMock.generateUiBuilderForms = jest.fn().mockImplementation(() => schemas.entities);
    utilsMock.getAmplifyDataSchema = jest.fn().mockImplementation(() => undefined);
    utilsMock.generateAmplifyUiBuilderIndexFile = jest.fn().mockImplementation(() => true);
    utilsMock.generateAmplifyUiBuilderUtilFile = jest.fn().mockImplementation(() => true);
  });

  it('runs generateComponents', async () => {
    await run(context);
    expect(mockedExport).toBeCalledTimes(3);
    expect(utilsMock.generateUiBuilderComponents).toBeCalledTimes(1);
    expect(utilsMock.generateUiBuilderThemes).toBeCalledTimes(1);
    expect(utilsMock.generateUiBuilderForms).toBeCalledTimes(1);
  });
  it('does not run generateComponents if not Amplify Admin app', async () => {
    CloudformationProviderFacade.isAmplifyAdminApp = jest.fn().mockImplementationOnce(() => ({
      isAdminApp: false,
    }));
    await run(context);
    expect(mockedExport).toBeCalledTimes(0);
    expect(utilsMock.generateUiBuilderComponents).toBeCalledTimes(0);
    expect(utilsMock.generateUiBuilderThemes).toBeCalledTimes(0);
    expect(utilsMock.generateUiBuilderForms).toBeCalledTimes(0);
  });
});
