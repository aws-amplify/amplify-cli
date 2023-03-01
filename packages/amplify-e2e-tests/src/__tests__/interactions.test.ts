import { updateInteractions } from '../../../amplify-e2e-core/src/categories/interactions';
import {
  addInteractionsWithBotFromScratch,
  addSampleInteraction,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBot,
  getProjectMeta,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';

describe('amplify add interactions', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('interactions');
    await initJSProjectWithProfile(projRoot, {});
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add simple interaction', async () => {
    await addSampleInteraction(projRoot);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const {
      FunctionArn: functionArn,
      BotName: botName,
      Region: region,
    } = Object.keys(meta.interactions).map((key) => meta.interactions[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(botName).toBeDefined();
    expect(region).toBeDefined();
    const bot = await getBot(botName, region);
    expect(bot.name).toEqual(botName);
  });

  it('should init a project and add interactions with all configurations', async () => {
    await addInteractionsWithBotFromScratch(projRoot, {
      intentName: 'testIntentName',
      slotName: 'testSlotName',
      slotType: 'testSlotType',
      slotDescription: 'testSlotDescription',
      slotValue: 'testSlotValue',
    });
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const {
      FunctionArn: functionArn,
      BotName: botName,
      Region: region,
    } = Object.keys(meta.interactions).map((key) => meta.interactions[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(botName).toBeDefined();
    expect(region).toBeDefined();
    const bot = await getBot(botName, region);
    expect(bot.name).toEqual(botName);
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
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const {
      FunctionArn: functionArn,
      BotName: botName,
      Region: region,
    } = Object.keys(meta.interactions).map((key) => meta.interactions[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(botName).toBeDefined();
    expect(region).toBeDefined();
    const bot = await getBot(botName, region);
    expect(bot.name).toEqual(botName);
  });
});
