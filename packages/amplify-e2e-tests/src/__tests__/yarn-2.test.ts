import { getNpxPath, sleep } from '@aws-amplify/amplify-e2e-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as execa from 'execa';

const createNewProjectDir = async (
  projectName: string,
  // eslint-disable-next-line spellcheck/spell-checker
  prefix = path.join(fs.realpathSync(os.tmpdir()), 'amplify-e2e-tests'),
): Promise<string> => {
  let projectDir;
  do {
    projectDir = path.join(prefix, `${projectName}_${Math.floor(Math.random() * 1000000)}`);
  } while (fs.existsSync(projectDir));

  fs.ensureDirSync(projectDir);

  const initialDelay = Math.floor(Math.random() * 5 * 1000);
  await sleep(initialDelay);

  console.log(projectDir);
  return projectDir;
};

describe('test tool versions triggered by yarn 2', () => {
  let projectRoot;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('tools-test');
  });

  afterEach(() => {
    fs.removeSync(projectRoot);
  });

  it('should use npm', async () => {
    const projectName = path.basename(projectRoot);
    const projectDir = path.dirname(projectRoot);

    execa.sync(getNpxPath(), ['create-react-app', projectName, '--scripts-version', '5.0.1', '--use-npm'], { cwd: projectDir });

    const contents = fs.readdirSync(projectRoot);
    expect(contents).toContain('package.json');
    expect(contents).not.toContain('yarn.lock');
  });
});
