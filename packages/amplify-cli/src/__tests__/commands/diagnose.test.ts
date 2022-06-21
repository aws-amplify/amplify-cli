import * as fs from 'fs-extra';
import archiver from 'archiver';
import { pathManager, stateManager } from 'amplify-cli-core';
import { Redactor } from 'amplify-cli-logger';
import { WriteStream } from 'fs-extra';
import fetch from 'node-fetch';
import * as uuid from 'uuid';
import { collectFiles } from '../../commands/helpers/collect-files';
import { run } from '../../commands/diagnose';
import { Context } from '../../domain/context';

jest.mock('uuid');
jest.mock('amplify-cli-core');
jest.mock('../../commands/helpers/collect-files');
jest.mock('../../commands/helpers/encryption-helpers', () => ({
  createHashedIdentifier: jest.fn().mockReturnValue({
    projectIdentifier: 'projectId',
    projectEnvIdentifier: 'projectId',
  }),
  encryptBuffer: jest.fn().mockReturnValue('encryptedString'),
  encryptKey: jest.fn().mockReturnValue('encryptedKey'),
}));
jest.mock('archiver');
jest.mock('fs-extra');
jest.mock('amplify-cli-logger', () => ({
  Redactor: jest.fn(),
  stringMasker: jest.fn(),
}));

jest.mock('path');
jest.mock('node-fetch', () => jest.fn().mockReturnValue({ status: 200 }));

const mockMeta = {
  providers: {
    awscloudformation: {
      // eslint-disable-next-line spellcheck/spell-checker
      AmplifyAppId: 'd2ew5jdgc57sa7',
    },
  },
  hosting: {},
  auth: {
    testAuth: {
      service: 'Cognito',
    },
  },
  storage: {
    testBucket: {
      service: 'S3',
    },
  },
  api: {
    myApi: {
      service: 'AppSync',
    },
  },
};
const collectedFiles : { filePath: string, redact: boolean }[] = [
  {
    filePath: 'file.ts',
    redact: false,
  },
  {
    filePath: 'file.json',
    redact: true,
  },
];

describe('run report command', () => {
  it('runs report command for only a resource', async () => {
    const contextMock = {
      usageData: {
        getUsageDataPayload: jest.fn().mockReturnValue({
          sessionUuid: 'sessionId',
          installationUuid: '',

        }),
      },
      exeInfo: {
        /* eslint-disable spellcheck/spell-checker */
        cloudFormationEvents: [
          {
            StackId: 'arn:aws:cloudformation:us-east-1:1234567891009:stack/amplify-pushfail-dev-230444/d7470930-8ac5-11ec-a30c-0a84db46e9eb',
            EventId: 'd006c2e0-c0f4-11ec-841d-0e43d8dbed1f',
            StackName: 'amplify-pushfail-dev-230444',
            LogicalResourceId: 'amplify-pushfail-dev-230444',
            PhysicalResourceId: 'arn:aws:cloudformation:us-east-1:1234567891009:stack/amplify-pushfail-dev-230444/d7470930-8ac5-11ec-a30c-0a84db46e9eb',
            ResourceType: 'AWS::CloudFormation::Stack',
            Timestamp: '2022-04-20T21:57:03.599Z',
            ResourceStatus: 'UPDATE_IN_PROGRESS',
            ResourceStatusReason: 'User Initiated',
          },
          {
            StackId: 'arn:aws:cloudformation:us-east-1:1234567891009:stack/amplify-pushfail-dev-230444/d7470930-8ac5-11ec-a30c-0a84db46e9eb',
            EventId: 'apipushfail-CREATE_IN_PROGRESS-2022-04-20T21:57:09.528Z',
            StackName: 'amplify-pushfail-dev-230444',
            LogicalResourceId: 'apipushfail',
            PhysicalResourceId: '',
            ResourceType: 'AWS::CloudFormation::Stack',
            Timestamp: '2022-04-20T21:57:09.528Z',
            ResourceStatus: 'CREATE_IN_PROGRESS',
          },
          {
            StackId: 'arn:aws:cloudformation:us-east-1:1234567891009:stack/amplify-pushfail-dev-230444/d7470930-8ac5-11ec-a30c-0a84db46e9eb',
            EventId: 'UpdateRolesWithIDPFunctionRole-CREATE_IN_PROGRESS-2022-04-20T21:57:09.540Z',
            StackName: 'amplify-pushfail-dev-230444',
            LogicalResourceId: 'UpdateRolesWithIDPFunctionRole',
            PhysicalResourceId: '',
            ResourceType: 'AWS::IAM::Role',
            Timestamp: '2022-04-20T21:57:09.540Z',
            ResourceStatus: 'CREATE_IN_PROGRESS',
          },
        ],
        /* eslint-enable spellcheck/spell-checker */

      },
      input: {
        options: {
          'send-report': true,
        },
      },
    };
    const mockRootPath = 'user/source/myProject';
    const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
    pathManagerMock.findProjectRoot = jest.fn().mockReturnValue(mockRootPath);

    const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
    stateManagerMock.getBackendConfig = jest.fn().mockReturnValue(mockMeta);
    stateManagerMock.getProjectConfig = jest.fn().mockReturnValue({ projectName: 'myProject' });

    const collectFilesMock = collectFiles as jest.MockedFunction<typeof collectFiles>;

    collectFilesMock.mockReturnValue(collectedFiles);

    const mockArchiver = archiver as jest.Mocked<typeof archiver>;
    const zipperMock = {
      append: jest.fn(),
      pipe: jest.fn(),
      finalize: jest.fn(),
    };
    mockArchiver.create = jest.fn().mockReturnValue(zipperMock);

    const fsMock = fs as jest.Mocked<typeof fs>;
    fsMock.createWriteStream.mockReturnValue({
      on: jest.fn().mockImplementation((event, resolveFunction) => {
        if (event === 'close') {
          resolveFunction();
        }
      }),
      error: jest.fn(),
    } as unknown as WriteStream);

    const uuidMock = uuid as jest.Mocked<typeof uuid>;
    uuidMock.v4.mockReturnValue('randomPassPhrase');

    const contextMockTyped = contextMock as unknown as Context;
    await run(contextMockTyped, new Error('mock error'));
    expect(fsMock.readFileSync).toBeCalled();
    expect(Redactor).toBeCalledTimes(1);
    expect(zipperMock.pipe).toBeCalled();
    expect(zipperMock.finalize).toBeCalled();
    expect(fetch).toBeCalled();
    expect(zipperMock.append).toBeCalledTimes(3);
  });
});
