import {
  addApiWithoutSchema,
  addS3StorageWithAuthOnly,
  addAuthWithDefault,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  getBackendConfig,
  diagnoseSendReport,
  diagnoseSendReport_ZipFailed,
} from '@aws-amplify/amplify-e2e-core';
import { extract } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import glob from 'glob';

const PARAMETERS_JSON = 'parameters.json';
const BUILD = 'build';
const CLI_INPUTS_JSON = 'cli-inputs.json';
const SCHEMA_GRAPHQL = 'schema.graphql';
const AWSCLOUDFORMATION = 'awscloudformation';
const ROOT_CLOUDFORMATION_STACK_JSON = 'root-cloudformation-stack.json';
const CLI_JSON = 'cli.json';
const CLOUDFORMATION_TEMPLATE_JSON = 'cloudformation-template.json';
const BACKEND = 'backend';
const BACKEND_CONFIG_JSON = 'backend-config.json';
const AMPLIFY = 'amplify';

const defaultsSettings = {};

describe('amplify diagnose --send-report', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('diagnoseTest');
  });

  afterEach(async () => {
    await deleteProject(projectRoot);
    deleteProjectDir(projectRoot);
  });

  it('...should send zips and verify files', async () => {
    await initJSProjectWithProfile(projectRoot, defaultsSettings);
    await addApiWithoutSchema(projectRoot, { transformerVersion: 2 });
    await addAuthWithDefault(projectRoot);
    await addS3StorageWithAuthOnly(projectRoot);
    const pathToZip = await diagnoseSendReport(projectRoot);
    expect(fs.existsSync(pathToZip)).toBeTruthy();
    const unzippedDir = path.join(path.dirname(pathToZip), 'unzipped');
    const filesInZip = await unzipAndReturnFiles(pathToZip, unzippedDir);
    const backend = getBackendConfig(projectRoot);
    const resources: { category: string; resourceName: string; service: string }[] = [];
    Object.keys(backend).reduce((array, key) => {
      Object.keys(backend[key]).forEach((resourceKey) => {
        array.push({
          category: key,
          resourceName: resourceKey,
          service: backend[key][resourceKey].service,
        });
      });
      return array;
    }, resources);
    const files = [];
    const amplifyBackendUnzipped = path.join(unzippedDir, AMPLIFY, BACKEND);
    resources.forEach((r) => {
      const categoryUnzippedPath = path.join(amplifyBackendUnzipped, r.category, r.resourceName);
      if (r.category === 'api') {
        files.push(path.join(categoryUnzippedPath, BUILD, CLOUDFORMATION_TEMPLATE_JSON));
        files.push(path.join(categoryUnzippedPath, BUILD, PARAMETERS_JSON));
        files.push(path.join(categoryUnzippedPath, CLI_INPUTS_JSON));
        files.push(path.join(categoryUnzippedPath, PARAMETERS_JSON));
        files.push(path.join(categoryUnzippedPath, SCHEMA_GRAPHQL));
      }

      if (r.category === 'auth') {
        files.push(path.join(categoryUnzippedPath, BUILD, `${r.resourceName}-${CLOUDFORMATION_TEMPLATE_JSON}`));
        files.push(path.join(categoryUnzippedPath, BUILD, PARAMETERS_JSON));
        files.push(path.join(categoryUnzippedPath, CLI_INPUTS_JSON));
      }

      if (r.category === 'storage') {
        files.push(path.join(categoryUnzippedPath, BUILD, CLOUDFORMATION_TEMPLATE_JSON));
        files.push(path.join(categoryUnzippedPath, BUILD, PARAMETERS_JSON));
        files.push(path.join(categoryUnzippedPath, CLI_INPUTS_JSON));
      }
    });

    files.push(path.join(amplifyBackendUnzipped, AWSCLOUDFORMATION, BUILD, ROOT_CLOUDFORMATION_STACK_JSON));
    files.push(path.join(amplifyBackendUnzipped, BACKEND_CONFIG_JSON));
    files.push(path.join(unzippedDir, AMPLIFY, CLI_JSON));
    expect(files.sort()).toEqual(filesInZip);
    fs.removeSync(unzippedDir);
    fs.unlinkSync(pathToZip);

    // delete the file and send report again
    const backendFConfigFilePath: string = path.join(projectRoot, 'amplify', 'backend', 'backend-config.json');
    fs.unlinkSync(backendFConfigFilePath);
    await diagnoseSendReport_ZipFailed(projectRoot);
  });
});
const unzipAndReturnFiles = async (zipPath: string, unzippedDir: string): Promise<string[]> => {
  fs.ensureDirSync(unzippedDir);
  await extract(zipPath, { dir: unzippedDir });
  console.log(unzippedDir);
  return glob
    .sync('**/*.*', {
      cwd: unzippedDir,
      absolute: true,
    })
    .sort();
};
