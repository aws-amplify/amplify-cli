import {
  addFunction,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  initJSProjectWithProfile,
  loadFunctionTestFile,
  overrideFunctionSrcNode,
} from '@aws-amplify/amplify-e2e-core';
import { v4 as uuid } from 'uuid';
import { execSync } from 'child_process';

describe('amplify push function cases:', () => {
  let projRoot: string;

  // Install Python 3.13 if not available
  beforeAll(async () => {
    try {
      execSync('python3.13 --version', { stdio: 'ignore' });
    } catch {
      console.log('Installing Python 3.13...');
      execSync(
        `
        wget -q https://www.python.org/ftp/python/3.13.0/Python-3.13.0.tgz &&
        tar xzf Python-3.13.0.tgz &&
        cd Python-3.13.0 &&
        ./configure --enable-optimizations --quiet &&
        make -j$(nproc) --quiet &&
        sudo make altinstall --quiet &&
        cd .. &&
        rm -rf Python-3.13.0*
      `,
        { stdio: 'inherit' },
      );
    }
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir('multiple-function-push');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should be able to push multiple functions at the same time', async () => {
    const projName = `multilambda${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, { name: projName });

    const [shortId] = uuid().split('-');
    const functionName = `nodetestfunction${shortId}`;

    await addFunction(projRoot, { functionTemplate: 'Hello World', name: functionName }, 'nodejs');
    await amplifyPushAuth(projRoot);

    const functionCode = loadFunctionTestFile('case-function.js').replace('{{testString}}', 'Hello from Lambda!');
    overrideFunctionSrcNode(projRoot, functionName, functionCode);
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'python');

    await amplifyPushAuth(projRoot);
  });
});
