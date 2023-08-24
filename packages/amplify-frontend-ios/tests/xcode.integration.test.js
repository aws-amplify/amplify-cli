const { importConfig, importModels } = require('../lib/amplify-xcode');
const path = require('path');
const fs = require('fs/promises');
const { existsSync } = require('fs');

jest.mock('@aws-amplify/amplify-cli-core', () => {
  const path = require('path');
  const amplifyIosResourcePath = path.resolve(__dirname, '..');
  return {
    pathManager: {
      getAmplifyPackageLibDirPath: jest.fn().mockReturnValue(amplifyIosResourcePath),
    },
  };
});

describe('Should call amplify-xcode binary', () => {
  if (process.platform === 'darwin') {
    const pathsToTest = [];
    beforeAll(async () => {
      const source = path.resolve(__dirname, 'sample-xcode-project');
      pathsToTest.push(source);
      const destination = path.resolve(__dirname, 'sample xcode project');
      pathsToTest.push(destination);
      if (!existsSync(destination)) {
        await fs.mkdir(destination);
        await fs.cp(source, destination, {
          recursive: true,
        });
      }
    });

    it('should importConfig', async () => {
      for (const projPath of pathsToTest) {
        await importConfig({ path: projPath });
      }
    });

    it('should importModels', async () => {
      for (const projPath of pathsToTest) {
        await importModels({ path: projPath });
      }
    });
  } else {
    it('dummy test', () => {
      console.log('Xcode integration test can only run on macOS');
    });
  }
});
