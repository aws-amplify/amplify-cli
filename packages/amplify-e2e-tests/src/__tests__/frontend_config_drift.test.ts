import {
  createNewProjectDir, deleteProject, deleteProjectDir, TEST_PROFILE_NAME,
} from '@aws-amplify/amplify-e2e-core';
import execa from 'execa';
import * as path from 'path';

const scriptPath = path.join(__dirname, '..', 'frontend-config-drift.sh');

beforeAll(async () => {
  await execa.command(`chmod +x ${scriptPath}`);
});

let projRoot: string;

beforeEach(async () => {
  projRoot = await createNewProjectDir('s3-test');
});

afterEach(async () => {
  await deleteProject(projRoot);
  deleteProjectDir(projRoot);
});

describe('android config file', () => {
  it('has expected properties', async () => {
    await execa(scriptPath, ['android', TEST_PROFILE_NAME], { cwd: projRoot, stdio: 'inherit' });
    // if script succeeds, test succeeds
  });
});

describe('ios config file', () => {
  it('has expected properties', async () => {
    await execa(scriptPath, ['ios', TEST_PROFILE_NAME], { cwd: projRoot, stdio: 'inherit' });
    // if script succeeds, test succeeds
  });
});
