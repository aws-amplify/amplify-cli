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
    const sampleXcodeProjectPath = path.resolve(__dirname, 'sample-xcode-project');
    const sampleXcodeProjectWithWhiteSpacePath = path.resolve(__dirname, 'sample xcode project');
    beforeAll(async () => {
      pathsToTest.push(sampleXcodeProjectPath);
      pathsToTest.push(sampleXcodeProjectWithWhiteSpacePath);
      if (!existsSync(sampleXcodeProjectWithWhiteSpacePath)) {
        await fs.mkdir(sampleXcodeProjectWithWhiteSpacePath);
        await fs.cp(sampleXcodeProjectPath, sampleXcodeProjectWithWhiteSpacePath, {
          recursive: true,
        });
      }
    });

    afterAll(async () => {
      if (existsSync(sampleXcodeProjectWithWhiteSpacePath)) {
        await fs.rm(sampleXcodeProjectWithWhiteSpacePath, {
          recursive: true,
          force: true,
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
