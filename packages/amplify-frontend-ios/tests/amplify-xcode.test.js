const { importConfig, importModels, generateSchema } = require('../lib/amplify-xcode');
const execa = require('execa');

const amplifyIosFakePath = '/amplify-ios/fake/path';
const expectedAmplifyXcodeBinaryPath = '/amplify-ios/fake/path/resources/amplify-xcode';

jest.mock('execa');
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  pathManager: {
    getAmplifyPackageLibDirPath: jest.fn().mockReturnValue(amplifyIosFakePath),
  },
}));

describe('Should call amplify-xcode binary', () => {
  it('should importConfig', async () => {
    const path = '/some/path';
    await importConfig({ path });
    expect(execa).toBeCalledWith(expectedAmplifyXcodeBinaryPath, ['import-config', '--path=/some/path'], { stdout: 'inherit' });
  });

  it('should importModels', async () => {
    const path = '/some/path';
    await importModels({ path });
    expect(execa).toBeCalledWith(expectedAmplifyXcodeBinaryPath, ['import-models', '--path=/some/path'], { stdout: 'inherit' });
  });

  it('should generateSchema', async () => {
    const path = '/some/path';
    await generateSchema({ 'output-path': path });
    expect(execa).toBeCalledWith(expectedAmplifyXcodeBinaryPath, ['generate-schema', '--output-path=/some/path'], { stdout: 'inherit' });
  });
});
