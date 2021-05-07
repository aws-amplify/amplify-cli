import * as fs from 'fs-extra';
import * as os from 'os';
import { LocalLogDirectory } from 'amplify-cli-logger';
import { insertAmplifyIgnore } from '../../../extensions/amplify-helpers/git-manager';
jest.mock('fs-extra');

const fsMock = fs as jest.Mocked<typeof fs>;

fsMock.readFileSync.mockImplementation(() => 'test');
fsMock.writeFileSync.mockImplementation();

const amplifyMark = '#amplify';

const ignoreList = [
  'amplify/\\#current-cloud-backend',
  'amplify/.config/local-*',
  `amplify/${LocalLogDirectory}`,
  'amplify/mock-data',
  'amplify/backend/amplify-meta.json',
  'amplify/backend/awscloudformation',
  'amplify/backend/.temp',
  'build/',
  'dist/',
  'node_modules/',
  'aws-exports.js',
  'awsconfiguration.json',
  'amplifyconfiguration.json',
  'amplifyconfiguration.dart',
  'amplify-build-config.json',
  'amplify-gradle-config.json',
  'amplifytools.xcconfig',
  '.secret-*',
];

const toAppend = `${os.EOL + os.EOL + amplifyMark + os.EOL}${ignoreList.join(os.EOL)}`;

describe('git-manager', () => {
  beforeEach(() => {
    fsMock.writeFileSync.mockClear();
  });
  const gitIgnoreFilePath = 'testPath';
  test('appends files to an existing .gitignore', () => {
    fsMock.existsSync.mockImplementation(() => true);
    insertAmplifyIgnore(gitIgnoreFilePath);
    expect(fsMock.appendFileSync.mock.calls[0][0]).toEqual('testPath');
    expect(fsMock.appendFileSync.mock.calls[0][1]).toEqual(toAppend);
  });
  test('create a new .gitignore', () => {
    fsMock.existsSync.mockImplementation(() => false);
    insertAmplifyIgnore(gitIgnoreFilePath);
    expect(fsMock.writeFileSync.mock.calls[0][0]).toEqual('testPath');
    expect(fsMock.writeFileSync.mock.calls[0][1]).toEqual(toAppend.trim());
  });
});
