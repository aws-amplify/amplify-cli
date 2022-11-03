import * as openSearchEmulator from '../index';
import fs from 'fs-extra';
import { join } from 'path';
import http from 'http';
import * as openpgp from 'openpgp';
import { $TSAny, isWindowsPlatform } from 'amplify-cli-core';
import { v4 } from 'uuid';
import execa from 'execa';

jest.mock('execa');
const execaMock = execa as jest.MockedFunction<typeof execa>;
(execaMock as any).mockImplementation(async () => ({ stdout: 'mock-process-output' }));

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  pathManager: {
    getAmplifyPackageLibDirPath: jest.fn().mockReturnValue('mock-path-to-lib'),
  }
}));

describe('emulator operations', () => {
  const getMockSearchableFolder = (): string => {
    let pathToSearchableMockResources = join(__dirname, '..', '..', 'resources', );
    do {
      pathToSearchableMockResources = join('/tmp', `amplify-cli-opensearch-emulator-${v4()}`, 'mock-api-resources', 'searchable');
    } while (fs.existsSync(pathToSearchableMockResources));
    return pathToSearchableMockResources;
  };
  const pathToSearchableLocal = join('mock-path-to-lib', openSearchEmulator.relativePathToOpensearchLocal);

  const mockSearchableResourcePath = getMockSearchableFolder();
  const startupErrorMessage = 'Unable to start the Opensearch emulator. Please restart the mock process.';
  const pathToSearchableData = join(mockSearchableResourcePath, 'searchable-data');
  fs.ensureDirSync(pathToSearchableData);
  const openSearchClusterOptions = {
    clusterName: 'mock-opensearch-cluster',
    nodeName: 'mock-opensearch-node-local',
    port: 9600,
    type: 'single-node',
    version: '1.3.0'
  };
  const openSearchClusterDefaultOptions = {
    clusterName: 'opensearch-cluster',
    nodeName: 'opensearch-node-local',
    port: 9200,
    type: 'single-node',
    version: '1.3.0'
  };
  const ensureMockSearchableResourcePath = () => {
    fs.ensureDirSync(mockSearchableResourcePath);
    fs.emptyDirSync(mockSearchableResourcePath);
  };

  let emulators: openSearchEmulator.OpenSearchEmulator[];
  beforeEach(async () => {
    ensureMockSearchableResourcePath();
    emulators = [];
    jest.setTimeout(5 * 60 * 1000);
    jest.resetModules();
    jest.spyOn(openpgp, 'verify').mockReturnValueOnce({
      signatures: [{
        verified: Promise.resolve(true)
      }]
    } as $TSAny);
  });

  afterEach(async () => {
    await Promise.all(emulators.map(emu => emu.terminate()));
  });

  afterAll(async () => {
    ensureMockSearchableResourcePath();
    fs.removeSync('mock-path-to-lib');
  });

  const fetchURL = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      http
        .get(url, (resp) => {
          let data = "";
          resp.on("data", (chunk) => {
            data += chunk;
          });
          resp.on("end", () => {
            resolve(data);
          });
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  };

  if (isWindowsPlatform) {
    it('should fail to launch on windows OS', async () => {
      try {
        await openSearchEmulator.launch(mockSearchableResourcePath);
        fail('launching simulator is expected to throw but did not');
      } catch (error) {
        expect(error.message).toEqual('Cannot launch OpenSearch Simulator on windows OS');
      }
    });
  } else {
    it('correctly resolves the path to local opensearch binary', async () => {
      const relativePathFromMockSearchableResourceDir = await openSearchEmulator.getPathToOpenSearchBinary();
      expect(relativePathFromMockSearchableResourceDir).toEqual(join('opensearchLib', 'bin', 'opensearch'));
      
      const fullPathToOpenSearchBinary = await openSearchEmulator.getPathToOpenSearchBinary(mockSearchableResourcePath);
      expect(fullPathToOpenSearchBinary).toEqual(join(mockSearchableResourcePath, 'opensearchLib', 'bin', 'opensearch'));
    });
    
    it('skips downloading another opensearch binary when one is locally available', async () => {
      const openSearchExists = await openSearchEmulator.openSearchLocalExists(mockSearchableResourcePath);
      // returns false when there is no local binary
      expect(openSearchExists).toEqual(false);

      const nodeFetch = await import('node-fetch');
      jest.mock('node-fetch', ()=>jest.fn());
      expect(nodeFetch).toBeCalledTimes(0);
    });
    
    it('correctly generates opensearch args from given options', async () => {
      const resolvedBuildArgs = openSearchEmulator.buildArgs(openSearchClusterOptions, pathToSearchableData);
      const expectedCall = `-Ecluster.name=${openSearchClusterOptions.clusterName} -Enode.name=${openSearchClusterOptions.nodeName} -Ehttp.port=${openSearchClusterOptions.port} -Ediscovery.type=${openSearchClusterOptions.type} -Epath.data=${pathToSearchableData}`;
      expect(resolvedBuildArgs.join(' ')).toEqual(expectedCall);
    });
    
    it('throws error if max re-tries is breached', async () => {
      try {
        await openSearchEmulator.launch(mockSearchableResourcePath, {}, 5);
        fail('launching simulator is expected to throw but did not');
      } catch (error) {
        expect(error.message).toEqual('Max retries hit for starting OpenSearch simulator');
      }
    });

    it('should attempt setting up local instance of opensearch with default configuration', async () => {
      jest.spyOn(openSearchEmulator, 'writeOpensearchEmulatorArtifacts').mockReturnValueOnce(Promise.resolve());
      jest.spyOn(openSearchEmulator, 'startOpensearchEmulator').mockReturnValueOnce(Promise.resolve(undefined));
      try {
        await openSearchEmulator.launch(pathToSearchableData);
      } catch(err) {
        expect(execaMock).toBeCalledWith(
          "opensearchLib/bin/opensearch", 
          [ `-Ecluster.name=${openSearchClusterDefaultOptions.clusterName}`, 
            `-Enode.name=${openSearchClusterDefaultOptions.nodeName}`, 
            `-Ehttp.port=${openSearchClusterDefaultOptions.port}`, 
            `-Ediscovery.type=${openSearchClusterDefaultOptions.type}`,
            `-Epath.data=${pathToSearchableData}`
          ], 
          { "cwd": pathToSearchableLocal }
        );
        expect(err?.message).toEqual(startupErrorMessage);
      }
    });

    it('should attempt setting up local instance of opensearch with custom configuration', async () => {
      jest.spyOn(openSearchEmulator, 'writeOpensearchEmulatorArtifacts').mockReturnValueOnce(Promise.resolve());
      jest.spyOn(openSearchEmulator, 'startOpensearchEmulator').mockReturnValueOnce(Promise.resolve(undefined));
      try {
        await openSearchEmulator.launch(pathToSearchableData, openSearchClusterOptions);
      } catch(err) {
        expect(execaMock).toBeCalledWith(
          "opensearchLib/bin/opensearch", 
          [ `-Ecluster.name=${openSearchClusterOptions.clusterName}`, 
            `-Enode.name=${openSearchClusterOptions.nodeName}`, 
            `-Ehttp.port=${openSearchClusterOptions.port}`, 
            `-Ediscovery.type=${openSearchClusterDefaultOptions.type}`,
            `-Epath.data=${pathToSearchableData}`
          ], 
          { "cwd": pathToSearchableLocal }
        );
        expect(err?.message).toEqual(startupErrorMessage);
      }
    });

    it('should resolve to correct opensearch local binary path', async () => {
      const resolvedDirectory = openSearchEmulator.getOpensearchLocalDirectory();
      expect(resolvedDirectory).toEqual(pathToSearchableLocal);
    });
  }
});
