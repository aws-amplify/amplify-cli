/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  addApiWithoutSchema,
  addAuthWithMaxOptions,
  addConvert,
  addS3StorageWithIdpAuth,
  amplifyPush,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  exportPullBackend,
  getBackendAmplifyMeta,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { getAWSExportsPath } from '../aws-exports/awsExports';

describe('amplify export pull a', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('exporttest');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a js project and compare with export pull', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'dev' });
    await AddandPushCategories();
    const exportsPath = getAWSExportsPath(projRoot);
    const pathToExportGeneratedConfig = await generatePullConfig('javascript');
    compareFileContents(exportsPath, path.join(pathToExportGeneratedConfig, path.basename(exportsPath)));
  });

  const compareFileContents = (path1: string, path2: string): void => {
    const fileString1 = fs.readFileSync(path1, 'utf-8');
    const fileString2 = fs.readFileSync(path2, 'utf-8');
    const object1 = JSON.parse(fileString1.substring(fileString1.indexOf('{'), fileString1.lastIndexOf('}') + 1));
    const object2 = JSON.parse(fileString2.substring(fileString2.indexOf('{'), fileString2.lastIndexOf('}') + 1));
    expect(recursiveComapre(object1, object2)).toBeTruthy();
  };

  const recursiveComapre = (object1: any, object2: any): boolean =>
    Object.keys(object1).reduce((equal, key) => {
      if (!equal) return false;
      if (typeof object1[key] !== 'object') {
        return object1[key] === object2[key];
      }
      return recursiveComapre(object1[key], object2[key]);
    }, true);

  const AddandPushCategories = async (frontend?: string): Promise<void> => {
    await addAuthWithMaxOptions(projRoot, { frontend });
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await addS3StorageWithIdpAuth(projRoot);
    await addConvert(projRoot);
    if (frontend === 'flutter') {
      await amplifyPushWithoutCodegen(projRoot);
    } else {
      await amplifyPush(projRoot);
    }
  };

  const generatePullConfig = async (frontend: string): Promise<string> => {
    const meta = getBackendAmplifyMeta(projRoot);
    const stackName = _.get(meta, ['providers', 'awscloudformation', 'StackName']);
    const pathToExportGeneratedConfig = path.join(projRoot, 'exportSrc');
    await fs.ensureDir(pathToExportGeneratedConfig);
    await exportPullBackend(projRoot, {
      exportPath: pathToExportGeneratedConfig,
      frontend,
      rootStackName: stackName,
    });
    return pathToExportGeneratedConfig;
  };
});
