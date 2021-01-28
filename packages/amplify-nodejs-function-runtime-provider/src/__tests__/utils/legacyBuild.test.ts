import glob from 'glob';
import fs from 'fs-extra';
import _ from 'lodash';
import { buildResource } from '../../../src/utils/legacyBuild';
import { BuildType } from 'amplify-function-plugin-interface';

jest.mock('glob');
jest.mock('fs-extra');

const glob_mock = glob as jest.Mocked<typeof glob>;
const fs_mock = fs as jest.Mocked<typeof fs>;

const timestamp = new Date().getTime();
const stubFileTimestamps = new Map<string, number>([
  ['resourceDir', timestamp - 1],
  ['package.json', timestamp - 1],
  ['dist/latest-build.zip', timestamp + 1],
  ['src/index.js', timestamp - 2],
  ['cfnTemplate.json', timestamp - 3],
  ['node_modules/somepackage', timestamp + 2],
]);

describe('legacy build resource', () => {
  it('checks resource directory excluding node_modules and dist for changes', async () => {
    glob_mock.sync.mockImplementationOnce(() => Array.from(stubFileTimestamps.keys()));
    fs_mock.statSync.mockImplementation(file => ({ mtime: new Date(stubFileTimestamps.get(file.toString())!) } as any));

    const result = await buildResource({
      lastBuildTimeStamp: new Date(timestamp),
      srcRoot: 'resourceDir',
      runtime: 'other',
      buildType: BuildType.PROD,
    });

    expect(result.rebuilt).toEqual(false);
    expect(glob_mock.sync.mock.calls.length).toBe(1);
    expect(fs_mock.statSync.mock.calls.length).toBe(5);
  });
});
