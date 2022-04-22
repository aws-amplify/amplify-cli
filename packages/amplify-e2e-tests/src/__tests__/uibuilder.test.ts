import {
  getBackendAmplifyMeta, getAppId, amplifyPull, createNewProjectDir, deleteProject, deleteProjectDir, initJSProjectWithProfile,
} from 'amplify-e2e-core';
import {
  getNpxPath, getNpmPath, myIconComponent, formCheckoutComponent,
} from 'amplify-e2e-core';
import { spawnSync, spawn } from 'child_process';
import { AmplifyUIBuilder } from 'aws-sdk';
import fs from 'fs-extra';
import path from 'path';

describe('amplify pull with uibuilder', () => {
  let projRoot: string;
  let projRoot2: string;
  let projectDir: string;
  let projectName: string;
  let reactDir: string;
  let appId: string;
  const envName = 'integtest';

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
    const amplifyUIBuilder = new AmplifyUIBuilder({ region: meta.providers.awscloudformation.Region });

    await amplifyUIBuilder.createComponent({
      appId,
      environmentName: envName,
      componentToCreate: myIconComponent,
    }).promise();

    await amplifyUIBuilder.createComponent({
      appId,
      environmentName: envName,
      componentToCreate: formCheckoutComponent,
    }).promise();
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
    deleteProjectDir(projRoot2);
    deleteProjectDir(reactDir);
  });

  it('appropriate uibiulder files are generated', async () => {
    spawnSync(getNpxPath(), ['create-react-app', projectName], { cwd: projectDir, encoding: 'utf-8' });
    await amplifyPull(reactDir, { appId, envName, emptyDir: true });
    const fileList = fs.readdirSync(`${reactDir}/src/ui-components/`);
    expect(fileList).toContain('FormCheckout.jsx');
    expect(fileList).toContain('FormCheckout.d.ts');
    expect(fileList).toContain('MyIcon.d.ts');
    expect(fileList).toContain('MyIcon.jsx');
    expect(fileList).toContain('index.js');
    expect(fileList).toHaveLength(5);

    spawnSync(
      getNpmPath(),
      // in some runs spawnSync/npx will still use an old ver of react-scripts moving it into npm install flow
      ['install', '-E', '@types/react', 'cypress', '@aws-amplify/ui-react', 'aws-amplify', 'react-scripts@5'],
      { cwd: reactDir },
    );

    fs.unlinkSync(`${reactDir}/src/App.js`);
    fs.writeFileSync(`${reactDir}/src/App.js`, fs.readFileSync(path.join(__dirname, '..', 'cypress', 'uibuilder', 'uibuilder-app.js')));
    fs.writeFileSync(`${reactDir}/cypress.json`, '{}');
    fs.mkdirsSync(`${reactDir}/cypress/integration/`);
    fs.writeFileSync(
      `${reactDir}/cypress/integration/sample_spec.js`,
      fs.readFileSync(path.join(__dirname, '..', 'cypress', 'uibuilder', 'uibuilder-spec.js')),
    );

    const npmStartProcess = spawn(getNpmPath(), ['start'], { cwd: reactDir, timeout: 300000 });
    // Give react server time to start
    await new Promise(resolve => setTimeout(resolve, 60000));
    const res = spawnSync(getNpxPath(), ['cypress', 'run'], { cwd: reactDir, encoding: 'utf8' });
    // kill the react server process
    spawnSync('kill', [`${npmStartProcess.pid}`], { encoding: 'utf8' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Seriously, kill the react server process
    // react-scripts somehow resurrects the process automatically after the first kill.
    spawnSync('pkill', ['-f', 'react'], { encoding: 'utf8' });
    expect(res.status).toBe(0);
  });
});
