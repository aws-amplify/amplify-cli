import {
  initJSProjectWithProfile,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getProjectTags,
  describeCloudFormationStack,
} from 'amplify-e2e-core';
import _ from 'lodash';
import { Amplify } from 'aws-sdk';

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
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });

    // This block of code gets the necessary info to compare the values of both the local tags from the JSON file and tags on the stack
    const amplifyMeta = getProjectMeta(projRoot);
    const meta = amplifyMeta.providers.awscloudformation;
    const rootStackInfo = await describeCloudFormationStack(meta.StackName, meta.Region);
    const localTags = getProjectTags(projRoot);

    expect(checkEquality(localTags, rootStackInfo.Tags)).toBeTruthy();
    const { AmplifyAppId, Region } = meta;
    const amplify = new Amplify({ region: Region });
    const amplifyApp = await amplify.getApp({ appId: AmplifyAppId }).promise();
    const tagMap = amplifyApp.app.tags;
    const amplifyTags = Object.keys(tagMap).map(key => {
      return {
        Key: key,
        Value: tagMap[key],
      };
    });
    expect(checkEquality(localTags, amplifyTags)).toBeTruthy();
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
