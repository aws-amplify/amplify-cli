const { importConfig, importModels } = require('../lib/amplify-xcode');
const path = require('path');

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
    it('should importConfig', async () => {
      const projPath = path.resolve(__dirname, 'sample xcode project');
      await importConfig({ path: projPath });
    });

    it('should importModels', async () => {
      const projPath = path.resolve(__dirname, 'sample xcode project');
      await importModels({ path: projPath });
    });
  } else {
    it('dummy test', () => {
      console.log('Xcode integration test can only run on macOS');
    });
  }
});
