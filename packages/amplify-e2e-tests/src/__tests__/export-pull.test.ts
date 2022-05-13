import {
  addApiWithoutSchema,
  addAuthWithMaxOptions,
  addConvert,
  addDEVHosting,
  addFunction,
  addInterpret,
  addRestApi,
  addS3Storage,
  addS3StorageWithIdpAuth,
  addSampleInteraction,
  addSMSNotification,
  amplifyPush,
  amplifyPushAuth,
  amplifyPushWithoutCodegen,
  amplifyPushWithUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  exportPullBackend,
  getAmplifyConfigAndroidPath,
  getAmplifyConfigIOSPath,
  getAmplifyIOSConfig,
  getAWSConfigAndroidPath,
  getAWSConfigIOSPath,
  getBackendAmplifyMeta,
  initAndroidProjectWithProfile,
  initFlutterProjectWithProfile,
  initIosProjectWithProfile,
  initJSProjectWithProfile,
  setAmplifyAppIdInBackendAmplifyMeta,
} from 'amplify-e2e-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { getAWSExportsPath } from '../aws-exports/awsExports';

describe('amplify export pull', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('exporttest');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a js project and compare with export pull', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'dev', disableAmplifyAppCreation: false  });
    //setAmplifyAppIdInBackendAmplifyMeta(projRoot);
    await AddandPushCategories();
    const exportsPath = getAWSExportsPath(projRoot);
    const pathToExportGeneratedConfig = await generatePullConfig('javascript');
    compareFileContents(exportsPath, path.join(pathToExportGeneratedConfig, path.basename(exportsPath)));
  });

  it('init an ios project and compare with export pull', async () => {
    await initIosProjectWithProfile(projRoot, { envName: 'dev', disableAmplifyAppCreation: false });
    //setAmplifyAppIdInBackendAmplifyMeta(projRoot);
    await AddandPushCategories('ios');
    const awsConfigPath = getAWSConfigIOSPath(projRoot);
    const amplifyConfigPath = getAmplifyConfigIOSPath(projRoot);
    const pullConfigPath = await generatePullConfig('ios');
    compareFileContents(awsConfigPath, path.join(pullConfigPath, path.basename(awsConfigPath)));
    compareFileContents(amplifyConfigPath, path.join(pullConfigPath, path.basename(amplifyConfigPath)));
  });

  it('init an android project and compare with export pull', async () => {
    await initAndroidProjectWithProfile(projRoot, { envName: 'dev', disableAmplifyAppCreation: false  });
    //setAmplifyAppIdInBackendAmplifyMeta(projRoot);
    await AddandPushCategories('android');
    const awsConfigPath = getAWSConfigAndroidPath(projRoot);
    const amplifyConfigPath = getAmplifyConfigAndroidPath(projRoot);
    const pullConfigPath = await generatePullConfig('android');
    compareFileContents(awsConfigPath, path.join(pullConfigPath, path.basename(awsConfigPath)));
    compareFileContents(amplifyConfigPath, path.join(pullConfigPath, path.basename(amplifyConfigPath)));
  });

  it('init a flutter project and compare with export pull', async () => {
    await initFlutterProjectWithProfile(projRoot, { envName: 'dev' });
    setAmplifyAppIdInBackendAmplifyMeta(projRoot);
    await AddandPushCategories('flutter');
    const amplifyConfigPath = path.join(projRoot, 'lib', 'amplifyconfiguration.dart');
    const pullConfigPath = await generatePullConfig('flutter');
    compareFileContents(amplifyConfigPath, path.join(pullConfigPath, path.basename(amplifyConfigPath)));
  });

  function compareFileContents(path1: string, path2: string) {
    const fileString1 = fs.readFileSync(path1, 'utf-8');
    const fileString2 = fs.readFileSync(path2, 'utf-8');
    const object1 = JSON.parse(fileString1.substring(fileString1.indexOf('{'), fileString1.lastIndexOf('}') + 1));
    const object2 = JSON.parse(fileString2.substring(fileString2.indexOf('{'), fileString2.lastIndexOf('}') + 1));
    expect(recursiveComapre(object1, object2)).toBeTruthy();
  }

  function recursiveComapre(object1: Object, object2: Object): boolean {
    return Object.keys(object1).reduce((equal, key) => {
      if (!equal) return false;
      if (typeof object1[key] !== 'object') {
        return object1[key] === object2[key];
      }
      return recursiveComapre(object1[key], object2[key]);
    }, true);
  }

  async function AddandPushCategories(frontend?: string) {
    await addAuthWithMaxOptions(projRoot, { frontend });
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await addDEVHosting(projRoot);
    await addS3StorageWithIdpAuth(projRoot);
    await addConvert(projRoot, {});
    if (frontend === 'flutter') {
      await amplifyPushWithoutCodegen(projRoot);
    } else {
      await amplifyPush(projRoot);
    }
  }

  async function generatePullConfig(frontend: string) {
    const meta = getBackendAmplifyMeta(projRoot);
    const stackName = _.get(meta, ['providers', 'awscloudformation', 'StackName']);
    const pathToExportGeneratedConfig = path.join(projRoot, 'exportSrc');
    fs.ensureDir(pathToExportGeneratedConfig);
    await exportPullBackend(projRoot, {
      exportPath: pathToExportGeneratedConfig,
      frontend,
      rootStackName: stackName,
    });
    return pathToExportGeneratedConfig;
  }
});
