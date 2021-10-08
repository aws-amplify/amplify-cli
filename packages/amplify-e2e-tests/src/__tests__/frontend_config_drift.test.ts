import { createNewProjectDir, deleteProject, deleteProjectDir, isCI } from 'amplify-e2e-core';
import execa from 'execa';
import * as path from 'path';

const scriptPath = path.join(__dirname, '..', 'frontend-config-drift.sh');
const awsProfile = isCI() ? 'amplify-integ-test-user' : 'default';

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
    await execa(scriptPath, ['android', awsProfile], { cwd: projRoot, stdio: 'inherit' });
    // if script succeeds, test succeeds
  });
});

describe('ios config file', () => {
  it('has expected properties', async () => {
    await execa(scriptPath, ['ios', awsProfile], { cwd: projRoot, stdio: 'inherit' });
    // if script succeeds, test succeeds
  });
});
