import * as fs from 'fs-extra';
import { insertAmplifyIgnore } from '../../../extensions/amplify-helpers/git-manager';
jest.mock('fs-extra');

const fsMock = fs as jest.Mocked<typeof fs>;

fsMock.readFileSync.mockImplementation(() => 'test');
fsMock.writeFileSync.mockImplementation();

describe('git-manager', () => {
  const gitIgnoreFilePath = '';
  test('append files should be excluded to .gitignore', () => {
    fsMock.existsSync.mockImplementation(() => true);
    insertAmplifyIgnore(gitIgnoreFilePath);
    expect(fsMock.appendFileSync).toHaveBeenCalled();
  });
  test('create a new .gitignore', () => {
    fsMock.existsSync.mockImplementation(() => false);
    insertAmplifyIgnore(gitIgnoreFilePath);
    expect(fsMock.writeFileSync).toHaveBeenCalled();
  });
});
