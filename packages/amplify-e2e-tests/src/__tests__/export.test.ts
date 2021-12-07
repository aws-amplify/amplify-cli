import {
  addApiWithoutSchema,
  addAuthWithMaxOptions,
  addS3StorageWithIdpAuth,
  amplifyPush,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  exportBackend,
  getProjectConfig,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import * as path from 'path';
import { JSONUtilities, readCFNTemplate } from 'amplify-cli-core';

describe('amplify export backend', () => {
  let projRoot: string;
  const projName = 'exporttest';
  beforeEach(async () => {
    projRoot = await createNewProjectDir(projName);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a js project and export', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'dev' });
    await addAuthWithMaxOptions(projRoot, {});
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await addS3StorageWithIdpAuth(projRoot);

    const exportPath = path.join(projRoot, 'exportedBackend');
    await exportBackend(projRoot, { exportPath });
    await amplifyPush(projRoot);
    const name = getProjectConfig(projRoot).projectName;
    const pathToExport = path.join(exportPath, `amplify-export-${name}`);
    const pathToStackMappings = path.join(pathToExport, 'category-stack-mapping.json');
    const pathToManifest = path.join(pathToExport, 'amplify-export-manifest.json');
    const stackMappings = JSONUtilities.readJson(pathToStackMappings) as { category: string; resourceName: string; service: string }[];
    const manifest = JSONUtilities.readJson(pathToManifest) as { stackName: string; props: any };
    const buildFolder = path.join(projRoot, 'amplify', 'backend', 'awscloudformation', 'build');
    stackMappings.forEach(mapping => {
      const template1 = getTemplateForMapping(mapping, buildFolder) 
      const stack = manifest.props.loadNestedStacks[mapping.category + mapping.resourceName];
      const template2 = readCFNTemplate(path.join(pathToExport, stack.templateFile)).cfnTemplate;
      matchTemplates(template1, template2);      
    });
   
  });
});

function matchTemplates(template: any, exporttemplate: any) {
  expect(Object.keys(template.Parameters)).toEqual(Object.keys(exporttemplate.Parameters))
  expect(Object.keys(template.Resources)).toEqual(Object.keys(exporttemplate.Resources))
  expect(Object.keys(template.Outputs)).toEqual(Object.keys(exporttemplate.Outputs))
  
}

function getTemplateForMapping(mapping:  { category: string; resourceName: string; service: string }, buildFolder: string) : any {
  let cfnFileName = 'cloudformation-template.json';
  if(mapping.service !== 'AppSync' && mapping.service !== 'S3'){
    cfnFileName = mapping.resourceName + '-' + cfnFileName 
  }
  const templatePath = mapping.category === 'function' ? 
  path.join(buildFolder, mapping.category, mapping.resourceName, cfnFileName) :
    path.join(buildFolder, mapping.category, mapping.resourceName, 'build', cfnFileName)
  return readCFNTemplate(templatePath).cfnTemplate;
}


