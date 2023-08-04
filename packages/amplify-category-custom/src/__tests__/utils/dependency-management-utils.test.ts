import { $TSContext, CFNTemplateFormat, readCFNTemplate, pathManager, stateManager, writeCFNTemplate } from '@aws-amplify/amplify-cli-core';
import { glob } from 'glob';
import { prompter } from '@aws-amplify/amplify-prompts';
import * as fs from 'fs-extra';
import * as cdk from 'aws-cdk-lib';
import {
  getResourceCfnOutputAttributes,
  getAllResources,
  addCDKResourceDependency,
  addCFNResourceDependency,
} from '../../utils/dependency-management-utils';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('glob');
jest.mock('fs-extra');

const readCFNTemplate_mock = readCFNTemplate as jest.MockedFunction<typeof readCFNTemplate>;
const writeCFNTemplate_mock = writeCFNTemplate as jest.MockedFunction<typeof writeCFNTemplate>;
writeCFNTemplate_mock.mockResolvedValue();

const glob_mock = glob as jest.Mocked<typeof glob>;
const fs_mock = fs as jest.Mocked<typeof fs>;

pathManager.getBackendDirPath = jest.fn().mockReturnValue('mockTargetDir');
pathManager.getResourceDirectoryPath = jest.fn().mockReturnValue('mockResourceDir');

describe('getResourceCfnOutputAttributes() scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('get resource attr for resources with build folder with one cfn file', async () => {
    fs_mock.existsSync.mockReturnValue(true); // if build dir exists

    readCFNTemplate_mock.mockReturnValueOnce({
      templateFormat: CFNTemplateFormat.JSON,
      cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
    });
    glob_mock.sync.mockReturnValueOnce(['mockFileName']);

    expect(getResourceCfnOutputAttributes('mockCategory', 'mockResourceName')).toEqual(['mockKey']);
  });

  it('get resource attr for resources with build folder with multiple cfn files', async () => {
    fs_mock.existsSync.mockReturnValue(true); // if build dir exists

    readCFNTemplate_mock.mockReturnValueOnce({
      templateFormat: CFNTemplateFormat.JSON,
      cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
    });

    glob_mock.sync.mockReturnValueOnce(['mockFileName1', 'mockFileName2']);

    expect(getResourceCfnOutputAttributes('mockCategory', 'mockResourceName')).toEqual([]);
  });

  it('get resource attr for resources without build folder', async () => {
    fs_mock.existsSync.mockReturnValue(false); // if build dir exists

    readCFNTemplate_mock.mockReturnValueOnce({
      templateFormat: CFNTemplateFormat.JSON,
      cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
    });
    glob_mock.sync.mockReturnValueOnce(['mockFileName']);

    expect(getResourceCfnOutputAttributes('mockCategory', 'mockResourceName')).toEqual(['mockKey']);
  });

  it('get resource attr for resources without build folder with multiple cfn files', async () => {
    fs_mock.existsSync.mockReturnValue(false); // if build dir exists

    readCFNTemplate_mock.mockReturnValueOnce({
      templateFormat: CFNTemplateFormat.JSON,
      cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
    });
    glob_mock.sync.mockReturnValueOnce(['mockFileName1', 'mockFileName2']);

    expect(getResourceCfnOutputAttributes('mockCategory', 'mockResourceName')).toEqual([]);
  });

  it('get resource attr for resources without any cfn files', async () => {
    fs_mock.existsSync.mockReturnValue(false); // if build dir exists
    glob_mock.sync.mockReturnValueOnce([]);

    expect(getResourceCfnOutputAttributes('mockCategory', 'mockResourceName')).toEqual([]);
  });
});

describe('getAllResources() scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('get all resource types', async () => {
    fs_mock.existsSync.mockReturnValue(false); // if build dir exists

    readCFNTemplate_mock.mockReturnValue({
      templateFormat: CFNTemplateFormat.JSON,
      cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
    });

    glob_mock.sync.mockReturnValue(['mockFileName']);

    stateManager.getMeta = jest.fn().mockReturnValue({
      mockCategory1: {
        mockResourceName1: {},
      },
      mockCategory2: {
        mockResourceName2: {},
      },
    });

    expect(getAllResources()).toEqual({
      mockCategory1: { mockResourceName1: { mockKey: 'string' } },
      mockCategory2: { mockResourceName2: { mockKey: 'string' } },
    });
  });
});

describe('addCDKResourceDependency() scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('get depenencies for a custom CDK stack', async () => {
    fs_mock.existsSync.mockReturnValue(false); // if build dir exists

    readCFNTemplate_mock.mockReturnValue({
      templateFormat: CFNTemplateFormat.JSON,
      cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
    });

    glob_mock.sync.mockReturnValue(['mockFileName']);

    const mockBackendConfig = {
      mockCategory1: {
        mockResourceName1: {},
      },
      mockCategory2: {
        mockResourceName2: {},
      },
      mockCategory3: {
        mockResourceName3: {},
      },
      mockCategory4: {
        mockResourceName4: {},
      },
    };

    stateManager.getBackendConfig = jest.fn().mockReturnValue(mockBackendConfig);

    stateManager.setBackendConfig = jest.fn();

    stateManager.getMeta = jest.fn().mockReturnValue(mockBackendConfig);

    stateManager.setMeta = jest.fn();
    const mockStack = new cdk.Stack();

    // test with adding one dependency at once
    let retVal = addCDKResourceDependency(mockStack, 'mockCategory1', 'mockResourceName1', [
      { category: 'mockCategory2', resourceName: 'mockResourceName2' },
    ]);

    expect(retVal).toEqual({
      mockCategory2: {
        mockResourceName2: { mockKey: 'mockCategory2mockResourceName2mockKey' },
      },
    });

    const postUpdateBackendConfig: any = mockBackendConfig;
    postUpdateBackendConfig.mockCategory1.mockResourceName1.dependsOn = [
      {
        attributes: ['mockKey'],
        category: 'mockCategory2',
        resourceName: 'mockResourceName2',
      },
    ];

    expect(stateManager.setMeta).toBeCalledWith(undefined, postUpdateBackendConfig);
    expect(stateManager.setBackendConfig).toBeCalledWith(undefined, postUpdateBackendConfig);

    // test with adding multiple dependencies at once

    retVal = addCDKResourceDependency(mockStack, 'mockCategory1', 'mockResourceName1', [
      { category: 'mockCategory4', resourceName: 'mockResourceName4' },
      { category: 'mockCategory3', resourceName: 'mockResourceName3' },
    ]);

    expect(retVal).toEqual({
      mockCategory4: {
        mockResourceName4: { mockKey: 'mockCategory4mockResourceName4mockKey' },
      },
      mockCategory3: {
        mockResourceName3: { mockKey: 'mockCategory3mockResourceName3mockKey' },
      },
    });

    postUpdateBackendConfig.mockCategory1.mockResourceName1.dependsOn = [
      {
        attributes: ['mockKey'],
        category: 'mockCategory3',
        resourceName: 'mockResourceName3',
      },
      {
        attributes: ['mockKey'],
        category: 'mockCategory4',
        resourceName: 'mockResourceName4',
      },
    ];

    expect(stateManager.setMeta).toBeCalledWith(undefined, postUpdateBackendConfig);
    expect(stateManager.setBackendConfig).toBeCalledWith(undefined, postUpdateBackendConfig);

    // test when adding multiple dependencies but none of the dependencies have outputs exported

    readCFNTemplate_mock.mockReturnValue({ templateFormat: CFNTemplateFormat.JSON, cfnTemplate: {} });

    retVal = addCDKResourceDependency(mockStack, 'mockCategory1', 'mockResourceName1', [
      { category: 'mockCategory4', resourceName: 'mockResourceName4' },
      { category: 'mockCategory3', resourceName: 'mockResourceName3' },
    ]);

    expect(retVal).toEqual({});
    expect(stateManager.setMeta).toBeCalledTimes(2); // from the previous two successful calls - and skip the last call
    expect(stateManager.setBackendConfig).toBeCalledTimes(2); // from the previous two successful calls - and skip the last call
  });
});

describe('addCFNResourceDependency() scenarios', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {
        openEditor: jest.fn(),
        updateamplifyMetaAfterResourceAdd: jest.fn(),
        copyBatch: jest.fn(),
        updateamplifyMetaAfterResourceUpdate: jest.fn(),
        getResourceStatus: jest.fn().mockResolvedValue({
          allResources: [
            {
              resourceName: 'mockresource1',
              service: 'customCDK',
            },
            {
              resourceName: 'mockresource2',
              service: 'customCDK',
            },
          ],
        }),
      },
    } as unknown as $TSContext;
  });

  it('add new resource dependency to custom cfn stack', async () => {
    prompter.yesOrNo = jest.fn().mockReturnValueOnce(true);
    fs_mock.existsSync.mockReturnValue(false); // if build dir exists

    readCFNTemplate_mock.mockReturnValue({
      templateFormat: CFNTemplateFormat.JSON,
      cfnTemplate: { Outputs: { mockKey: { Value: 'mockValue' } } },
    });

    glob_mock.sync.mockReturnValue(['mockFileName']);

    const mockBackendConfig = {
      mockCategory1: {
        mockResourceName1: {},
      },
      mockCategory2: {
        mockResourceName2: {},
      },
      mockCategory3: {
        mockResourceName3: {},
      },
      custom: {
        customResourcename: {},
      },
    };

    stateManager.getBackendConfig = jest.fn().mockReturnValue(mockBackendConfig);

    stateManager.setBackendConfig = jest.fn();

    stateManager.getMeta = jest.fn().mockReturnValue(mockBackendConfig);

    stateManager.setMeta = jest.fn();

    // test with adding one dependency at once

    const prompterMock = prompter as jest.Mocked<typeof prompter>;
    prompterMock.pick.mockResolvedValueOnce(['mockCategory1']).mockResolvedValueOnce(['mockResourceName1']);

    await addCFNResourceDependency(mockContext, 'customResourcename');

    expect(writeCFNTemplate_mock).toBeCalledWith(
      {
        Outputs: { mockKey: { Value: 'mockValue' } },
        Parameters: {
          mockCategory1mockResourceName1mockKey: {
            Description: 'Input parameter describing mockKey attribute for mockCategory1/mockResourceName1 resource',
            Type: 'String',
          },
        },
      },
      expect.anything(),
      { templateFormat: 'json' },
    );

    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith('custom', 'customResourcename', 'dependsOn', [
      { attributes: ['mockKey'], category: 'mockCategory1', resourceName: 'mockResourceName1' },
    ]);
  });
});
