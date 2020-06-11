const fs = require('fs-extra');
const path = require('path');
const constants = require('../lib/constants');
const { EOL } = require('os');
const frontConfigCreator = require('../lib/frontend-config-creator');

const graphqlConfigFileContent = `\
projects:${EOL}\
  graphQLResource:${EOL}\
    schemaPath: graphql/schema.json${EOL}\
    includes:${EOL}\
      - src/graphql/**/*.js${EOL}\
    excludes:${EOL}\
      - ./amplify/**${EOL}\
    extensions:${EOL}\
      amplify:${EOL}\
        codeGenTarget: javascript${EOL}\
        generatedFileName: ''${EOL}\
        docsFilePath: graphql${EOL}\
extensions:${EOL}\
  amplify:${EOL}\
    version: 3`;

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

  const graphqlConfigFilePath = path.join(dir, '.graphqlconfig.yml');
  const awsConfigFilePath = path.join(dir, constants.awsConfigFilename);
  const amplifyConfigFilePath = path.join(dir, constants.amplifyConfigFilename);
  const schemaFile = path.join(dir, 'graphql', 'schema.json');

  it('should not delete folder', () => {
    fs.ensureDirSync(path.join(dir, 'graphql'));
    fs.writeFileSync(graphqlConfigFilePath, graphqlConfigFileContent);
    fs.writeFileSync(awsConfigFilePath, '');
    fs.writeFileSync(amplifyConfigFilePath, '');
    fs.writeFile(schemaFile, '');
    frontConfigCreator.deleteAmplifyConfig(mockContext);
    expect(fs.existsSync()).toBeFalsy();
    expect(fs.existsSync()).toBeFalsy();
    expect(fs.existsSync(dir)).toBeTruthy();
    fs.removeSync(dir);
  });
});
