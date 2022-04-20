import * as fs from 'fs-extra';
import archiver from 'archiver';
import { $TSContext, pathManager, stateManager } from 'amplify-cli-core';
import { Redactor, stringMasker } from 'amplify-cli-logger';
import { collectFiles } from '../../commands/helpers/collect-files';
import { run } from '../../commands/report';

jest.mock('amplify-cli-core');
jest.mock('../../commands/helpers/collect-files');
jest.mock('archiver');
jest.mock('fs-extra');
jest.mock('amplify-cli-logger');

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
    };
    const mockRootPath = 'user/source/myProject';
    const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
    pathManagerMock.findProjectRoot = jest.fn().mockReturnValue(mockRootPath);

    const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
    stateManagerMock.getBackendConfig = jest.fn().mockReturnValue(mockMeta);
    stateManagerMock.getProjectConfig = jest.fn().mockReturnValue({});

    const collectFilesMock = collectFiles as jest.MockedFunction<typeof collectFiles>;

    collectFilesMock.mockReturnValue(collectedFiles);

    const mockArchiver = archiver as jest.Mocked<typeof archiver>;
    const zipperMock = {
      append: jest.fn(),
    };
    mockArchiver.create = jest.fn().mockReturnValue(zipperMock);

    const fsMock = fs as jest.Mocked<typeof fs>;

    const RedactorMock = Redactor as jest.MockedFunction<typeof Redactor>;
    const stringMaskerMock = stringMasker as jest.MockedFunction<typeof stringMasker>;

    //const mockedPath = path as jest.Mocked<typeof path>;
    const contextMockTyped = contextMock as unknown as $TSContext;
    await run(contextMockTyped, undefined);
    expect(fsMock.readFileSync).toBeCalled();
    expect(RedactorMock).toBeCalled();
    expect(stringMaskerMock).toBeCalled();
  });
});
