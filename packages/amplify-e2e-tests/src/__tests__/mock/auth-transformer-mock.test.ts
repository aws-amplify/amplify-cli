import {
  addApiWithAllAuthModes,
  amplifyMock,
  createNewProjectDir, deleteProject, deleteProjectDir,
  initJSProjectWithProfile,
  updateApiSchema,
} from '@aws-amplify/amplify-e2e-core';
import {GraphQLClient} from '../../../../amplify-util-mock/src/__e2e__/utils';


describe('Test auth transformer with mock', () => {
  const projName = 'authmock'
  const apiKey = 'da-fake-api-key';
  const endpoint = 'http://localhost:20002';
  let projRoot: string;
  let executionContext;
  let graphqlClient;
  beforeEach(async () => {
    projRoot = await createNewProjectDir(projName);
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithAllAuthModes(projRoot, { transformerVersion: 2 });
    await updateApiSchema(projRoot, projName, 'simple_model_api_key.graphql');
    executionContext = amplifyMock(projRoot);
    graphqlClient = new GraphQLClient(endpoint, { 'x-api-key': apiKey });
  });

  afterEach(async () => {
    await executionContext.sendCtrlC().runAsync();
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('Should execute a simple list query against mock server', async () => {
    const response = await graphqlClient.query(
      `query {
        listTodos(input: {title: "Test Todo"}) {
          items {
            id
            name
          }
        }
      }`,
      {},
    );
    expect(response?.data?.listTodos).toBeDefined();
  });
});
