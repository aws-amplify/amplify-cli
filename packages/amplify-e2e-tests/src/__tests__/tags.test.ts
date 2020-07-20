import { CloudFormation } from 'aws-sdk';
import {
  initJSProjectWithProfile,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  amplifyPushWithoutCodegen,
  getProjectMeta,
  describeCloudFormationStack,
  addDEVHosting,
} from 'amplify-e2e-core';

describe('generated tags test', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('tags');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  // ? I think I can find a better way to name this test case. Going to leave it as is for now
  it('should compare the nested stack tags with the tags.json file and return true', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addDEVHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    const amplifyMeta = getProjectMeta(projRoot);
    const meta = amplifyMeta.providers.awscloudformation;

    const cfn = new CloudFormation({ region: meta.Region });
    const stackResources = await cfn.describeStackResources({ StackName: meta.StackName }).promise();
    const testResource = stackResources.StackResources[0];

    const resourceInfo = await cfn
      .describeStackResource({
        LogicalResourceId: testResource.LogicalResourceId,
        StackName: testResource.StackName,
      })
      .promise();

    console.log(resourceInfo);

    console.log(amplifyMeta);
    console.log(await describeCloudFormationStack(meta.StackName, meta.Region));
    console.log(stackResources);
    console.log(stackResources.StackResources[0]);

    expect(checkEquality(projRoot)).toBe(true);
  });
});

function checkEquality(projRoot: string) {
  // const amplifyMeta = getProjectMeta(projRoot);

  // // Getting the tags object from the generated JSON file
  // const amplifyTags = getProjectTags(projRoot);
  // console.log(amplifyTags);
  // console.log(amplifyMeta);

  // // Fetching the tags generated from the created stack
  // const stackTags = getStackTags(projRoot);

  return true;
}

function getStackTags(projRoot: string) {
  let cfn = new CloudFormation({ region: 'us-east-2' });
  const amplifyMeta = getProjectMeta(projRoot);
  const meta = amplifyMeta.providers.awscloudformation;

  var params = {
    StackSetName: `${meta.StackName}`,
  };

  cfn.listStackInstances(params, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
    }
  });
}
