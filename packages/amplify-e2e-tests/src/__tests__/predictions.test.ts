import { initJSProjectWithProfile, deleteProject, amplifyPushAuth } from '../init';
import { createNewProjectDir, deleteProjectDir, getAWSExports, getCollection } from '../utils';
import { addConvert, addInterpret, addIdentifyCollection } from '../categories/predictions';
import { addAuthWithDefault } from '../categories/auth';

describe('amplify add predictions', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
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
    console.log(`AWS Exports \n${JSON.stringify(awsExports, null, 4)}`);
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
    console.log(`AWS Exports \n${JSON.stringify(awsExports, null, 4)}`);
    const { collectionId: collectionID, maxEntities: maxFaces } = awsExports.predictions.identify.identifyEntities.defaults;
    const { region, celebrityDetectionEnabled } = awsExports.predictions.identify.identifyEntities;
    expect(collectionID).toBeDefined();
    expect(maxFaces).toEqual(50);
    expect(celebrityDetectionEnabled).toBeTruthy();
    const cID = await getCollection(collectionID, region);
    console.log(`Rekog Collection Response ${JSON.stringify(cID, null, 4)}`);
    expect(cID.CollectionARN.split('/').pop()).toEqual(collectionID);
  });
});
