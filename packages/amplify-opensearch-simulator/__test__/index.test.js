const openSearchEmulator = require('../index');
const fs = require('fs-extra');
const { join } = require('path');
const http = require("http");


describe('emulator operations', () => {
  const mockSearchableResourcePath = join(__dirname, 'mock-api-resources', 'searchable');

  const openSearchClusterOptions = {
    clusterName: 'mock-opensearch-cluster',
    nodeName: 'mock-opensearch-node-local',
    port: 9600,
    version: '1.3.0'
  };

  const openSearchClusterDefaultOptions = {
    clusterName: 'opensearch-cluster',
    nodeName: 'opensearch-node-local',
    port: 9200,
    version: '1.3.0'
  };

  const ensureMockSearchableResourcePath = () => {
    fs.ensureDirSync(mockSearchableResourcePath);
    fs.emptyDirSync(mockSearchableResourcePath);
  };

  let emulators;
  beforeEach(async () => {
    ensureMockSearchableResourcePath();
    emulators = [];
    jest.setTimeout(5 * 60 * 1000);
  });

  afterEach(async () => {
    await Promise.all(emulators.map(emu => emu.terminate()));
  });

  afterAll(async () => {
    ensureMockSearchableResourcePath();
  });

  const fetch = async (url) => {
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

  if (process.platform.startsWith('win')) {
    it('should fail to launch on windows OS', async () => {
        try {
            await openSearchEmulator.launch(mockSearchableResourcePath);
            fail('launching simulator is expected to throw but did not');
        } catch (error) {
            expect(error.message).toEqual('Cannot launch OpenSearch Simulator on windows OS');
        }
    });
  }
  else {

    it('should setup local instance of opensearch with default configuration', async () => {
        const emu = await openSearchEmulator.launch(mockSearchableResourcePath);
        emulators.push(emu);
    
        expect(emu.port).toEqual(openSearchClusterDefaultOptions.port);
        expect(emu.url).toEqual(`http://localhost:${openSearchClusterDefaultOptions.port}/`);
    
        const openSearchInstanceDetails = JSON.parse(await fetch(emu.url));
        expect(openSearchInstanceDetails.name).toEqual(openSearchClusterDefaultOptions.nodeName);
        expect(openSearchInstanceDetails.cluster_name).toEqual(openSearchClusterDefaultOptions.clusterName);
        expect(openSearchInstanceDetails.version.number).toEqual(openSearchClusterDefaultOptions.version);
    });

    it('should setup local instance of opensearch with custom configuration', async () => {
        const emu = await openSearchEmulator.launch(mockSearchableResourcePath, openSearchClusterOptions);
        emulators.push(emu);
    
        expect(emu.port).toEqual(openSearchClusterOptions.port);
        expect(emu.url).toEqual(`http://localhost:${openSearchClusterOptions.port}/`);
    
        const openSearchInstanceDetails = JSON.parse(await fetch(emu.url));
        expect(openSearchInstanceDetails.name).toEqual(openSearchClusterOptions.nodeName);
        expect(openSearchInstanceDetails.cluster_name).toEqual(openSearchClusterOptions.clusterName);
        expect(openSearchInstanceDetails.version.number).toEqual(openSearchClusterOptions.version);
    });

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

        openSearchEmulator.openSearchLocalExists = jest.fn().mockReturnValueOnce(true);
        const nodefetch = require('node-fetch');
        jest.mock('node-fetch', ()=>jest.fn());
        nodefetch.mockReturnValueOnce('');
        expect(nodefetch).toBeCalledTimes(0);
    });
    
    it('correctly generates opensearch args from given options', async () => {
        const resolvedBuildArgs = openSearchEmulator.buildArgs(openSearchClusterOptions);
        const expectedCall = `-Ecluster.name=${openSearchClusterOptions.clusterName} -Enode.name=${openSearchClusterOptions.nodeName} -Ehttp.port=${openSearchClusterOptions.port}`;
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
  }
});
