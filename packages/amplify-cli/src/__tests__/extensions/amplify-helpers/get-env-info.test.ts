import * as fs from 'fs-extra';
import { getEnvInfo } from '../../../../src/extensions/amplify-helpers/get-env-info';
import { readJsonFile } from '../../../../src/extensions/amplify-helpers/read-json-file';
import { getLocalEnvFilePath } from '../../../../src/extensions/amplify-helpers/path-manager';

jest.mock('fs-extra');
jest.mock('../../../../src/extensions/amplify-helpers/read-json-file', () => ({ readJsonFile: jest.fn() }));
jest.mock('../../../../src/extensions/amplify-helpers/path-manager', () => ({ getLocalEnvFilePath: jest.fn() }));

beforeAll(() => {
  (getLocalEnvFilePath as any).mockReturnValue('test/path');
  (readJsonFile as any).mockReturnValue({ test: true });
});

test('Return env file info', () => {
  (fs.existsSync as any).mockReturnValue(true);
  expect(getEnvInfo()).toHaveProperty('test', true);
});

test('Throw UndeterminedEnvironmentError', () => {
  (fs.existsSync as any).mockReturnValue(false);
  expect(() => {
    getEnvInfo();
  }).toThrow();
});
