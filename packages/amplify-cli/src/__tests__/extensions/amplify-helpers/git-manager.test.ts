import * as fs from 'fs-extra';
import * as os from 'os';
import { LocalLogDirectory } from 'amplify-cli-logger';
import { insertAmplifyIgnore } from '../../../extensions/amplify-helpers/git-manager';
jest.mock('fs-extra');

const fsMock = fs as jest.Mocked<typeof fs>;

fsMock.readFileSync.mockImplementation(() => 'test');
fsMock.writeFileSync.mockImplementation();

const amplifyMark = '#amplify-do-not-edit-begin';
const amplifyEndMark = '#amplify-do-not-edit-end';
const deprecatedAmplifyMark = '#amplify';

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
  '**.sample',
];

const toAppend = `${os.EOL + os.EOL + amplifyMark + os.EOL}${ignoreList.join(os.EOL)}${os.EOL + amplifyEndMark + os.EOL}`;
const legacyToAppend = `${os.EOL + os.EOL + deprecatedAmplifyMark + os.EOL}${ignoreList.join(os.EOL)}`;
describe('git-manager', () => {
  beforeEach(() => {
    fsMock.writeFileSync.mockClear();
    fsMock.readFileSync.mockClear();
    fsMock.appendFileSync.mockClear();
    fsMock.existsSync.mockClear();
  });
  const gitIgnoreFilePath = 'testPath';
  test('appends files to an existing .gitignore', () => {
    fsMock.existsSync.mockImplementation(() => true);
    fsMock.readFileSync.mockImplementation(() => 'amplify/');
    insertAmplifyIgnore(gitIgnoreFilePath);
    expect(fsMock.writeFileSync.mock.calls[0][0]).toEqual(gitIgnoreFilePath);
    expect(fsMock.writeFileSync.mock.calls[0][1]).toEqual('amplify/');
    expect(fsMock.appendFileSync.mock.calls[0][0]).toEqual(gitIgnoreFilePath);
    expect(fsMock.appendFileSync.mock.calls[0][1]).toEqual(toAppend);
  });
  test('create a new .gitignore', () => {
    fsMock.existsSync.mockImplementation(() => false);
    insertAmplifyIgnore(gitIgnoreFilePath);
    expect(fsMock.writeFileSync.mock.calls[0][0]).toEqual(gitIgnoreFilePath);
    expect(fsMock.writeFileSync.mock.calls[0][1]).toEqual(toAppend.trim());
  });
  test('legacy .gitignore files reformat themselves when accessed by a newer version of the CLI', () => {
    fsMock.existsSync.mockImplementation(() => true);
    fsMock.readFileSync.mockImplementation(() => 'amplify/' + os.EOL + legacyToAppend.trim());
    insertAmplifyIgnore(gitIgnoreFilePath);
    expect(fsMock.writeFileSync.mock.calls[0][0]).toEqual(gitIgnoreFilePath);
    expect(fsMock.writeFileSync.mock.calls[0][1]).toEqual('amplify/');
    expect(fsMock.appendFileSync.mock.calls[0][0]).toEqual(gitIgnoreFilePath);
    expect(fsMock.appendFileSync.mock.calls[0][1]).toEqual(toAppend);
  });
});
