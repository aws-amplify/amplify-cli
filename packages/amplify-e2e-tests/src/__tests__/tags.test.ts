import {
  initJSProjectWithProfile,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  amplifyPushWithoutCodegen,
  getProjectMeta,
  getProjectTags,
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
  it('should compare the nested stack tags key with the tags.json file and return true', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addDEVHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    // This block of code gets the necessary info to compare the values of both the local tags from the JSON file and tags on the stack
    const amplifyMeta = getProjectMeta(projRoot);
    const meta = amplifyMeta.providers.awscloudformation;
    const rootStackInfo = await describeCloudFormationStack(meta.StackName, meta.Region);
    const localTags = getProjectTags(projRoot);

    // Currently only checks to make sure that thhe pushed tags have the same amount and name of keys than the ones added locally on the tags.json file
    expect(checkEquality(localTags, rootStackInfo.Tags)).toBe(true);
  });
});

// ? Not sure if this is the best way to indicate an array of objects in TS
function checkEquality(localTags: {}[], generatedTags: {}[]) {
  localTags.forEach(tagObj => {
    const rootTag = generatedTags.find(obj => obj['Key'] === tagObj['Key']);
    if (tagObj['Key'] !== rootTag['Key']) return false;
  });

  return true;
}
