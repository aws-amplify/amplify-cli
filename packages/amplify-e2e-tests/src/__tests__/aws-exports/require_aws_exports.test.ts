import * as fs from 'fs-extra';

import {
  createNewProjectDir,
  getAmplifyInitConfig,
  getAwsProviderConfig,
  getNpmPath,
  getNpxPath,
  nonInteractiveInitAttach,
  nspawn,
} from '@aws-amplify/amplify-e2e-core';
import {} from '@aws-amplify/amplify-e2e-core';
import execa from 'execa';
import { spawnSync } from 'child_process';

const nextIndexContent = `export default function Home() {
    return (
      <div>
        {Object.entries(process.env.AWS_EXPORTS).map(
          ([key, value]) => \`\${key}: \${value}\`
        )}
      </div>
    );
  }  
`;

const nextConfigContent = `module.exports = () => {
    const env = {
      AWS_EXPORTS: (() => require("./src/aws-exports"))(),
    };
  
    return { env };
  };  
`;

describe('test require on aws-exports file on different JS projects', () => {
  let projRoot1: string;
  let projRoot2: string;
  const envName = 'dev';

  beforeAll(async () => {
    projRoot1 = await createNewProjectDir('aws-exports-test');
    projRoot2 = await createNewProjectDir('aws-exports-test');
  });

  afterAll(async () => {
    // await deleteProject(projRoot);
    // deleteProjectDir(projRoot);
  });

  test('works with commonJS', async () => {
    // init next app
    const projectDir = await createNextApp(projRoot2, 'commonjs');

    // install amplify dependency
    spawnSync(getNpmPath(), ['install', '-E', '@aws-amplify/ui-react', 'aws-amplify'], { cwd: projectDir });

    // amplify init, this will generate aws-exports in the project
    await nonInteractiveInitAttach(projectDir, getAmplifyInitConfig('commonjs', envName), getAwsProviderConfig());

    // check if amplify init generated project files
    expect(fs.existsSync(`${projectDir}/src/aws-exports.js`)).toBeTruthy();
    expect(fs.existsSync(`${projectDir}/amplify/.config/project-config.json`)).toBeTruthy();
    expect(fs.existsSync(`${projectDir}/next.config.js`)).toBeTruthy();

    fs.writeFileSync(`${projectDir}/pages/index.js`, nextIndexContent, { encoding: 'utf8', flag: 'w' });
    fs.writeFileSync(`${projectDir}/next.config.js`, nextConfigContent, { encoding: 'utf8', flag: 'w' });

    // this will attempt to compile and start next server.
    await nspawn(getNpmPath(), ['run', 'dev'], { cwd: projectDir }).wait('compiled client and server successfully').runAsync();
  });

  test.skip('works with es6', async () => {
    const projectDir = await createReactApp(projRoot1, 'es6');

    await nonInteractiveInitAttach(projectDir, getAmplifyInitConfig('es6', envName), getAwsProviderConfig());

    console.log('react', fs.readdirSync(projectDir));
  });
});

// returns path to react project directory
async function createReactApp(cwd: string, projectName: string) {
  const projectRoot = `${cwd}/${projectName}`;

  execa.sync(getNpxPath(), ['create-react-app', projectName, '--use-npm'], { cwd, encoding: 'utf-8' });

  return projectRoot;
}

async function createNextApp(cwd: string, projectName: string) {
  const projectRoot = `${cwd}/${projectName}`;

  execa.sync(getNpxPath(), ['create-next-app', projectName, '--use-npm', '--example', 'with-env-from-next-config-js'], {
    cwd,
    encoding: 'utf-8',
  });

  return projectRoot;
}
