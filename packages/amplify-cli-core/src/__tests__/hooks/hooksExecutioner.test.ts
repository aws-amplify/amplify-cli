import { executeHooks, HooksHandler, skipHooksFilePath } from '../../hooks';
import * as skipHooksModule from '../../hooks/skipHooks';
import * as execa from 'execa';
import { pathManager, stateManager } from '../../state-manager';
import * as path from 'path';
import * as fs from 'fs-extra';

const pathToPython3Runtime = 'path/to/python3/runtime';
const pathToPythonRuntime = 'path/to/python/runtime';
const pathToNodeRuntime = 'path/to/node/runtime';
const preStatusNodeFileName = 'pre-status.js';
const preStatusPythonFileName = 'pre-status.py';
const preAddFileName = 'pre-add.js';
const preAddAuthFileName = 'pre-add-auth.js';
const postAddFileName = 'post-add.js';
const postAddAuthFileName = 'post-add-auth.js';
const testProjectRootPath = path.join(__dirname, '..', 'testFiles', 'hooks-test-project');
const testProjectHooksDirPath = path.join(testProjectRootPath, 'amplify', 'hooks');

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;

pathManager_mock.findProjectRoot.mockReturnValue(testProjectRootPath);
pathManager_mock.getHooksDirPath.mockReturnValue(testProjectHooksDirPath);

jest.mock('execa');
jest.mock('process');
jest.mock('../../state-manager');
jest.mock('which', () => ({
  sync: jest.fn().mockImplementation(runtimeName => {
    if (runtimeName == 'python3') return pathToPython3Runtime;
    else if (runtimeName == 'python') return pathToPythonRuntime;
    else if (runtimeName == 'node') return pathToNodeRuntime;
  }),
}));

const mockSkipHooks = jest.spyOn(skipHooksModule, 'skipHooks');

describe('hooksExecutioner tests', () => {
  beforeEach(async () => {
    HooksHandler.initialize();
    mockSkipHooks.mockReturnValue(false);
    jest.clearAllMocks();
  });
  afterEach(() => {
    HooksHandler.releaseInstance();
  });

  test('test skipHooks', async () => {
    mockSkipHooks.mockRestore();

    const orgSkipHooksExist = fs.existsSync(skipHooksFilePath);

    fs.ensureFileSync(skipHooksFilePath);
    // skip hooks file exists so no execa calls should be made
    await executeHooks({ input: { command: 'push', plugin: 'core' } }, 'pre');
    expect(execa).toHaveBeenCalledTimes(0);

    fs.removeSync(skipHooksFilePath);
    // skip hooks file does not exists so execa calls should be made
    await executeHooks({ input: { command: 'push', plugin: 'core' } }, 'pre');
    expect(execa).not.toHaveBeenCalledTimes(0);

    // resoring the original state of skip hooks file
    if (!orgSkipHooksExist) fs.removeSync(skipHooksFilePath);
    else fs.ensureFileSync(skipHooksFilePath);
  });

  test('executeHooks with no context', async () => {
    await executeHooks();
    expect(execa).toHaveBeenCalledTimes(0);
    const hooksHandler = HooksHandler.initialize();
    hooksHandler.hooksEvent = { seperator: '-', command: 'add' };
    await executeHooks(undefined, 'pre');
    expect(execa).toHaveBeenCalledTimes(1);
  });

  test('should not call execa for unrecognised events', async () => {
    await executeHooks({ input: { command: 'init', plugin: 'core' } }, 'pre');
    expect(execa).toHaveBeenCalledTimes(0);
  });

  //   TODO: complete the following test:
  // test('should exit with exit code 1 if execa process exit with non zero exit', async () => {
  //   jest.clearAllMocks();
  //   const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
  //     return undefined as never;
  //   });
  //   await executeHooks({ input: { command: 'push', plugin: 'core' } }, 'pre');
  //   expect(execa).toHaveBeenCalledTimes(1);
  //   expect(process.exit).toHaveBeenCalledTimes(1);
  //   expect(mockExit).toBeCalledWith(1);
  // });

  test('should execute in specificity execution order', async () => {
    await executeHooks({ input: { command: 'add', plugin: 'auth' } }, 'pre');
    expect(execa).toHaveBeenNthCalledWith(1, pathToNodeRuntime, [path.join(testProjectHooksDirPath, preAddFileName)], expect.anything());
    expect(execa).toHaveBeenNthCalledWith(
      2,
      pathToNodeRuntime,
      [path.join(testProjectHooksDirPath, preAddAuthFileName)],
      expect.anything(),
    );

    await executeHooks({ input: { command: 'add', plugin: 'auth' } }, 'post');
    expect(execa).toHaveBeenNthCalledWith(
      3,
      pathToNodeRuntime,
      [path.join(testProjectHooksDirPath, postAddAuthFileName)],
      expect.anything(),
    );
    expect(execa).toHaveBeenNthCalledWith(4, pathToNodeRuntime, [path.join(testProjectHooksDirPath, postAddFileName)], expect.anything());
  });

  test('should determine runtime from hooks-config', async () => {
    stateManager_mock.getHooksConfigJson.mockReturnValueOnce({ extension: { py: { runtime: 'python3' } } });
    await executeHooks({ input: { command: 'pull', plugin: 'core' } }, 'pre');
    expect(execa).toHaveBeenCalledWith(pathToPython3Runtime, expect.anything(), expect.anything());
  });

  test('should determine windows runtime from hooks-config', async () => {
    stateManager_mock.getHooksConfigJson.mockReturnValueOnce({ extension: { py: { runtime: 'python3', windows: { runtime: 'python' } } } });
    Object.defineProperty(process, 'platform', { value: 'win32' });
    await executeHooks({ input: { command: 'pull', plugin: 'core' } }, 'pre');
    expect(execa).toHaveBeenCalledWith(pathToPythonRuntime, expect.anything(), expect.anything());
  });

  test('should not run the script for undefined extension/runtime', async () => {
    await executeHooks({ input: { command: 'pull', plugin: 'core' } }, 'pre');
    expect(execa).toBeCalledTimes(0);
  });

  test('should throw error if duplicate hook scripts are present', async () => {
    const duplicateErrorThrown = 'found duplicate hook scripts: ' + preStatusNodeFileName + ', ' + preStatusPythonFileName;
    stateManager_mock.getHooksConfigJson.mockReturnValueOnce({
      extension: { py: { runtime: 'python3' } },
    });
    await expect(executeHooks({ input: { command: 'status', plugin: 'core' } }, 'pre')).rejects.toThrow(duplicateErrorThrown);
  });
});
