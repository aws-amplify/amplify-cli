/* eslint-disable spellcheck/spell-checker */
import {
  getBackendAmplifyMeta,
  getAppId,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  getNpxPath,
  getNpmPath,
  myIconComponent,
  formCheckoutComponent,
  enableAdminUI,
  amplifyStudioHeadlessPull,
} from '@aws-amplify/amplify-e2e-core';
import { spawnSync, spawn } from 'child_process';
import { AmplifyUIBuilder } from 'aws-sdk';
import fs from 'fs-extra';
import path from 'path';
import * as execa from 'execa';

describe('amplify pull with uibuilder', () => {
  let projRoot: string;
  let projRoot2: string;
  let projectDir: string;
  let projectName: string;
  let reactDir: string;
  let appId: string;

  const envName = 'integtest';
  // fixes recent esm module changes by removing require, while still disabling supportFile
  const cypressConfig = `
    module.exports = {
      e2e: {
        supportFile: false
      }
    }
  `;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('pull-uibuilder');
    projRoot2 = await createNewProjectDir('pull-uibuilder-2');
    projectName = `${path.basename(projRoot)}reactapp`;
    projectDir = path.dirname(projRoot2);
    reactDir = `${projectDir}/${projectName}`;

    await initJSProjectWithProfile(projRoot, {
      disableAmplifyAppCreation: false,
      name: 'uibuildertest',
    });

    appId = getAppId(projRoot);
    const meta = getBackendAmplifyMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const amplifyUIBuilder = new AmplifyUIBuilder({ region });

    await amplifyUIBuilder
      .createComponent({
        appId,
        environmentName: envName,
        componentToCreate: myIconComponent,
      })
      .promise();

    await amplifyUIBuilder
      .createComponent({
        appId,
        environmentName: envName,
        componentToCreate: formCheckoutComponent,
      })
      .promise();

    // needs to enable studio for resources to be pull down
    await enableAdminUI(appId, envName, region);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
    deleteProjectDir(projRoot2);
    deleteProjectDir(reactDir);
  });

  it('appropriate uibuilder files are generated', async () => {
    execa.sync(getNpxPath(), ['create-react-app', projectName, '--use-npm'], { cwd: projectDir, encoding: 'utf-8' });
    await amplifyStudioHeadlessPull(reactDir, { appId, envName });
    const fileList = fs.readdirSync(`${reactDir}/src/ui-components/`);
    expect(fileList).toContain('FormCheckout.jsx');
    expect(fileList).toContain('FormCheckout.d.ts');
    expect(fileList).toContain('MyIcon.d.ts');
    expect(fileList).toContain('MyIcon.jsx');
    expect(fileList).toContain('index.js');
    expect(fileList).toContain('studioTheme.js');
    expect(fileList).toContain('studioTheme.js.d.ts');
    expect(fileList).toContain('utils.js');
    expect(fileList).toHaveLength(8);

    spawnSync(
      getNpmPath(),
      // in some runs spawnSync/npx will still use an old ver of react-scripts moving it into npm install flow
      ['install', '-E', '@types/react', 'cypress', '@aws-amplify/ui-react', 'aws-amplify', 'react-scripts@5', '--legacy-peer-deps'],
      { cwd: reactDir },
    );

    fs.unlinkSync(`${reactDir}/src/App.js`);
    fs.writeFileSync(`${reactDir}/src/App.js`, fs.readFileSync(path.join(__dirname, '..', 'cypress', 'uibuilder', 'uibuilder-app.js')));
    fs.writeFileSync(`${reactDir}/cypress.config.js`, cypressConfig);
    fs.mkdirsSync(`${reactDir}/cypress/e2e/`);
    fs.writeFileSync(
      `${reactDir}/cypress/e2e/sample_spec.cy.js`,
      fs.readFileSync(path.join(__dirname, '..', 'cypress', 'uibuilder', 'uibuilder-spec.js')),
    );
    const npmStartProcess = spawn(getNpmPath(), ['start'], { cwd: reactDir, timeout: 300000 });
    // Give react server time to start
    await new Promise((resolve) => setTimeout(resolve, 60000));
    const res = execa.sync(getNpxPath(), ['cypress', 'run'], {
      cwd: reactDir,
      encoding: 'utf8',
    });
    // kill the react server process
    spawnSync('kill', [`${npmStartProcess.pid}`], { encoding: 'utf8' });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Seriously, kill the react server process
    // react-scripts somehow resurrects the process automatically after the first kill.
    spawnSync('pkill', ['-f', 'react'], { encoding: 'utf8' });
    expect(res.exitCode).toBe(0);
  });
});
