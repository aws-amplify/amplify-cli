import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPush,
  createRandomName,
  addS3AndAuthWithAuthOnlyAccess,
  amplifyPushForce,
  addApiWithoutSchema,
  updateApiSchema,
  getProjectMeta,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import gql from 'graphql-tag';

(global as any).fetch = require('node-fetch');

describe('transformer predictions migration test', () => {
  let projRoot: string;
  let projectName: string;

  beforeEach(async () => {
    projectName = createRandomName();
    projRoot = await createNewProjectDir(createRandomName());
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addS3AndAuthWithAuthOnlyAccess(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('migration of predictions directives', async () => {
    const predictionsSchema = 'transformer_migration/predictions.graphql';

    await addApiWithoutSchema(projRoot, { apiName: projectName, transformerVersion: 1 });
    await updateApiSchema(projRoot, projectName, predictionsSchema);
    await amplifyPush(projRoot);

    let appSyncClient = getAppSyncClientFromProj(projRoot);

    const translateQuery = /* GraphQL */ `
      query TranslateThis {
        translateThis(input: { translateText: { sourceLanguage: "en", targetLanguage: "de", text: "This is a voice test" } })
      }
    `;

    let translateResult = await appSyncClient.query({
      query: gql(translateQuery),
      fetchPolicy: 'no-cache',
    });

    expect(translateResult.errors).toBeUndefined();
    expect(translateResult.data).toBeDefined();
    expect((translateResult.data as any).translateThis).toMatch(
      /((\bDies\b)|(\bdas\b)|(\bder\b)) ist ein ((\bStimmtest\b)|(\Sprachtest\b)|(\bStimmentest\b))/i,
    );

    const speakQuery = /* GraphQL */ `
      query SpeakTranslatedText {
        speakTranslatedText(
          input: {
            translateText: { sourceLanguage: "en", targetLanguage: "es", text: "this is a voice test" }
            convertTextToSpeech: { voiceID: "Conchita" }
          }
        )
      }
    `;

    let speakResult = await appSyncClient.query({
      query: gql(speakQuery),
      fetchPolicy: 'no-cache',
    });

    expect(speakResult.errors).toBeUndefined();
    expect(speakResult.data).toBeDefined();
    expect((speakResult.data as any).speakTranslatedText).toMatch(
      /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/,
    );

    await updateApiSchema(projRoot, projectName, predictionsSchema);
    await amplifyPushForce(projRoot);

    appSyncClient = getAppSyncClientFromProj(projRoot);

    translateResult = await appSyncClient.query({
      query: gql(translateQuery),
      fetchPolicy: 'no-cache',
    });

    expect(translateResult.errors).toBeUndefined();
    expect(translateResult.data).toBeDefined();
    expect((translateResult.data as any).translateThis).toMatch(
      /((\bDies\b)|(\bdas\b)|(\bder\b)) ist ein ((\bStimmtest\b)|(\Sprachtest\b)|(\bStimmentest\b))/i,
    );

    speakResult = await appSyncClient.query({
      query: gql(speakQuery),
      fetchPolicy: 'no-cache',
    });

    expect(speakResult.errors).toBeUndefined();
    expect(speakResult.data).toBeDefined();
    expect((speakResult.data as any).speakTranslatedText).toMatch(
      /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/,
    );
  });

  const getAppSyncClientFromProj = (projRoot: string) => {
    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region as string;
    const { output } = meta.api[projectName];
    const url = output.GraphQLAPIEndpointOutput as string;
    const apiKey = output.GraphQLAPIKeyOutput as string;

    return new AWSAppSyncClient({
      url,
      region,
      disableOffline: true,
      auth: {
        type: AUTH_TYPE.API_KEY,
        apiKey,
      },
    });
  };
});
