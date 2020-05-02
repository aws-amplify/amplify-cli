import { initJSProjectWithProfile, deleteProject, amplifyPushAuth } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir, getCollection } from 'amplify-e2e-core';
import { addConvert, addInterpret, addIdentifyCollection } from 'amplify-e2e-core';
import { addAuthWithDefault } from 'amplify-e2e-core';
import { getAWSExports } from '../aws-exports/awsExports';

describe('amplify add predictions', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('predictions');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project with convert subcategory translate text', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addConvert(projRoot, {});
    await addInterpret(projRoot, {});
    await amplifyPushAuth(projRoot);
    const awsExports: any = getAWSExports(projRoot).default;
    const { sourceLanguage, targetLanguage } = awsExports.predictions.convert.translateText.defaults;
    const { type } = awsExports.predictions.interpret.interpretText.defaults;
    expect(sourceLanguage).toBeDefined();
    expect(targetLanguage).toBeDefined();
    expect(type).toEqual('ALL');
  });

  it('init a project with identify sub category identifyEntities with collection config', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addIdentifyCollection(projRoot, {});
    await amplifyPushAuth(projRoot);
    const awsExports: any = getAWSExports(projRoot).default;
    const { collectionId: collectionID, maxEntities: maxFaces } = awsExports.predictions.identify.identifyEntities.defaults;
    const { region, celebrityDetectionEnabled } = awsExports.predictions.identify.identifyEntities;
    expect(collectionID).toBeDefined();
    expect(maxFaces).toEqual(50);
    expect(celebrityDetectionEnabled).toBeTruthy();
    const cID = await getCollection(collectionID, region);
    expect(cID.CollectionARN.split('/').pop()).toEqual(collectionID);
  });
});
