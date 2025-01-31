import { CFNTemplateFormat, pathManager, readCFNTemplate, stateManager, writeCFNTemplate } from '@aws-amplify/amplify-cli-core';
import { Template } from 'cloudform-types';
import * as path from 'path';
import { preProcessCFNTemplate, writeCustomPoliciesToCFNTemplate } from '../../pre-push-cfn-processor/cfn-pre-processor';
import { prePushCfnTemplateModifier } from '../../pre-push-cfn-processor/pre-push-cfn-modifier';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('../../pre-push-cfn-processor/pre-push-cfn-modifier');

const readCFNTemplate_mock = readCFNTemplate as jest.MockedFunction<typeof readCFNTemplate>;
const writeCFNTemplate_mock = writeCFNTemplate as jest.MockedFunction<typeof writeCFNTemplate>;
const prePushCfnTemplateModifier_mock = prePushCfnTemplateModifier as jest.MockedFunction<typeof prePushCfnTemplateModifier>;
const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

const cfnTemplate = {
  test: 'content',
} as unknown as Template;
const templateFormat = CFNTemplateFormat.JSON;

readCFNTemplate_mock.mockReturnValue({
  templateFormat,
  cfnTemplate,
});

prePushCfnTemplateModifier_mock.mockImplementation(async (template: any) => {
  template.test = 'modified';
});

const backendPath = '/project/amplify/backend';
const resourcePath = 'api/resourceName/cfn-template-name.json';

pathManager_mock.getBackendDirPath.mockReturnValue(backendPath);
pathManager_mock.getResourceDirectoryPath.mockReturnValue(backendPath);
stateManager_mock.getLocalEnvInfo.mockReturnValue({ envName: 'test' });

describe('preProcessCFNTemplate', () => {
  beforeEach(jest.clearAllMocks);
  it('writes the modified template and returns the path', async () => {
    const newPath = await preProcessCFNTemplate(path.join(backendPath, resourcePath));
    expect(writeCFNTemplate_mock.mock.calls[0]).toMatchInlineSnapshot(`
[
  {
    "test": "modified",
  },
  "/project/amplify/backend/awscloudformation/build/api/resourceName/cfn-template-name.json",
  {
    "minify": undefined,
    "templateFormat": "json",
  },
]
`);
    expect(newPath).toMatchInlineSnapshot(`"/project/amplify/backend/awscloudformation/build/api/resourceName/cfn-template-name.json"`);
  });

  it('writes to root build directory if path is not within backend dir', async () => {
    const newPath = await preProcessCFNTemplate(path.join('/something/else', resourcePath));
    expect(newPath).toMatchInlineSnapshot(`"/project/amplify/backend/awscloudformation/build/cfn-template-name.json"`);
  });

  it('test writeCustonPolicies with Lambda function', async () => {
    await writeCustomPoliciesToCFNTemplate('testLambdaResourceName', 'Lambda', '../dummypath', 'function');
    expect(pathManager_mock.getResourceDirectoryPath).toBeCalledWith(undefined, 'function', 'testLambdaResourceName');
    expect(readCFNTemplate_mock).toBeCalled();
  });

  it('test writeCustonPolicies with LambdaLayer function', async () => {
    await writeCustomPoliciesToCFNTemplate('testLambdaResourceName', 'LambdaLayer', '../dummypath', 'function');
    expect(pathManager_mock.getResourceDirectoryPath).not.toBeCalled();
    expect(readCFNTemplate_mock).not.toBeCalled();
  });

  it('test writeCustonPolicies with Containers Api', async () => {
    await writeCustomPoliciesToCFNTemplate('testApiResourceName', 'ElasticContainer', '../dummypath', 'api');
    expect(pathManager_mock.getResourceDirectoryPath).toBeCalledWith(undefined, 'api', 'testApiResourceName');
    expect(readCFNTemplate_mock).toBeCalled();
  });

  it('test writeCustonPolicies with Appsync', async () => {
    pathManager_mock.getResourceDirectoryPath.mockClear();
    readCFNTemplate_mock.mockClear();
    await writeCustomPoliciesToCFNTemplate('testApiResourceName', 'AppSync', '../dummypath', 'api');
    expect(pathManager_mock.getResourceDirectoryPath).not.toBeCalled();
    expect(readCFNTemplate_mock).not.toBeCalled();
  });
});
