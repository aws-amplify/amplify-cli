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
  deleteS3Bucket,
  removeHosting,
  extractHostingBucketInfo,
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

  it('should compare the nested stack tags key with the tags.json file and return true', async () => {
    const projName = 'tagsTest';
    const envName = 'devtag';
    await initJSProjectWithProfile(projRoot, { name: projName, envName });
    await addDEVHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    // This block of code gets the necessary info to compare the values of both the local tags from the JSON file and tags on the stack
    const amplifyMeta = getProjectMeta(projRoot);
    const meta = amplifyMeta.providers.awscloudformation;
    const rootStackInfo = await describeCloudFormationStack(meta.StackName, meta.Region);
    const localTags = getProjectTags(projRoot);

    // Currently only checks to make sure that the pushed tags have the same amount and name of keys than the ones added locally on the tags.json file
    expect(checkEquality(localTags, rootStackInfo.Tags)).toBe(true);
    expect(rootStackInfo.Tags.filter(r => r.Key === 'user:Stack')[0].Value).toEqual(envName);
    expect(rootStackInfo.Tags.filter(r => r.Key === 'user:Application')[0].Value).toEqual(projName);

    // clean up
    const hostingBucket = extractHostingBucketInfo(projRoot);
    await removeHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    if (hostingBucket) {
      try {
        await deleteS3Bucket(hostingBucket);
      } catch {}
    }
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
