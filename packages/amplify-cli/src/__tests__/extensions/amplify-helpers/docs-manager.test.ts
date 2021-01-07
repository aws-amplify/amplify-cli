import * as fs from 'fs-extra';
import { writeReadMeFile } from '../../../../src/extensions/amplify-helpers/docs-manager';

jest.mock('fs-extra');

beforeAll(() => {
  (fs.writeFileSync as any).mockReturnValue();
});

test('writeReadMeFile should write README content', () => {
  writeReadMeFile('.');
  expect(fs.writeFileSync).toBeCalled();
});
