import {
  addInteractionsWithBotFromScratch,
  updateInteractions,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  getBackendAmplifyMeta,
} from '@aws-amplify/amplify-e2e-core';

describe('amplify add interactions', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('interactions');
    await initJSProjectWithProfile(projRoot, { name: 'interactions' });
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should init a project and add interactions with all configurations and update interactions', async () => {
    await addInteractionsWithBotFromScratch(projRoot, {
      intentName: 'testIntentName',
      slotName: 'testSlotName',
      slotType: 'testSlotType',
      slotDescription: 'testSlotDescription',
      slotValue: 'testSlotValue',
    });
    await updateInteractions(projRoot, { slotName: 'newTestSlotName' });
    const meta = getBackendAmplifyMeta(projRoot);
    expect(meta.interactions).toBeDefined();
  });
});
