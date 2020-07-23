const fs = require('fs-extra');
const path = require('path');
const constants = require('../lib/constants');
const frontConfigCreator = require('../lib/frontend-config-creator');
const gqlConfig = require('graphql-config');
const _ = require('lodash');

describe('test config creator', () => {
  const dir = './testsourceproj';
  const mockContext = {
    exeInfo: {
      localEnvInfo: {
        projectPath: dir,
      },
    },
    amplify: {},
  };

  const awsConfigFilePath = path.join(dir, constants.awsConfigFilename);
  const amplifyConfigFilePath = path.join(dir, constants.amplifyConfigFilename);
  const files = constants.fileNames.map(filename => path.join(dir, 'graphql', `${filename}.${constants.FILE_EXTENSION_MAP['javascript']}`));

  it('should not attempt deleted generatedfile name if empty', () => {
    fs.removeSync = jest.fn();
    fs.existsSync = jest.fn().mockReturnValue(true);
    gqlConfig.getGraphQLConfig = jest.fn().mockReturnValue({
      config: {
        projects: {
          graphQLResource: {
            extensions: {
              amplify: {
                codeGenTarget: 'javascript',
                generatedFileName: '',
                docsFilePath: 'graphql',
              },
            },
          },
        },
      },
    });

    frontConfigCreator.deleteAmplifyConfig(mockContext);
    const removeSyncCalls = _.flatten(fs.removeSync.mock.calls);
    [awsConfigFilePath, amplifyConfigFilePath, ...files].forEach(file => {
      expect(removeSyncCalls).toContain(file);
    });
    expect(removeSyncCalls.includes(path.join(dir, ''))).toBeFalsy();
  });
});
