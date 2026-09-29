import { deploy, launchDDBLocal, terminateDDB, logDebug, GraphQLClient } from '../__e2e__/utils';
import { AmplifyAppSyncSimulator } from '@aws-amplify/amplify-appsync-simulator';
import { transformAndSynth, defaultTransformParams } from './test-synthesizer';

let GRAPHQL_CLIENT: GraphQLClient;
let GRAPHQL_ENDPOINT: string;
let ddbEmulator = null;
let dbPath = null;
let server: AmplifyAppSyncSimulator;

jest.setTimeout(20000);

describe('@model with relational transformers', () => {
  beforeAll(async () => {
    const validSchema = `
      type AProject @model(subscriptions: null) @auth(rules: [{ allow: public }]) {
        projectId: String! @primaryKey
        name: String
        team: ATeam @hasOne
      }

      type ATeam @model(subscriptions: null) @auth(rules: [{ allow: public }]) {
        teamId: String! @primaryKey
        name: String
      }

      type BProject @model(subscriptions: null) @auth(rules: [{ allow: public }]) {
        projectId: String! @primaryKey
        name: String
        teams: [BTeam] @hasMany
      }

      type BTeam @model(subscriptions: null) @auth(rules: [{ allow: public }]) {
        teamId: String! @primaryKey
        name: String
      }

      type CProject @model(subscriptions: null) @auth(rules: [{ allow: public }]) {
        projectId: ID! @primaryKey
        name: String
        team: CTeam @hasOne
      }

      type CTeam @model(subscriptions: null) @auth(rules: [{ allow: public }]) {
        teamId: ID! @primaryKey
        name: String
        project: CProject @hasOne
      }

      type DProject @model(subscriptions: null) @auth(rules: [{ allow: public }]) {
        projectId: ID! @primaryKey
        name: String
        teams: [DTeam] @hasMany(indexName: "byDTeam")
      }

      type DTeam @model(subscriptions: null) @auth(rules: [{ allow: public }]) {
        teamId: ID! @primaryKey
        name: String
        dTeamProjectId: ID @index(name: "byDTeam")
        project: DProject @belongsTo(fields: ["dTeamProjectId"])
      }`;
    try {
      const out = transformAndSynth({
        ...defaultTransformParams,
        schema: validSchema,
        transformParameters: {
          ...defaultTransformParams.transformParameters,
          respectPrimaryKeyAttributesOnConnectionField: false,
        },
      });

      let ddbClient;
      ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());
      const result = await deploy(out, ddbClient);
      server = result.simulator;

      GRAPHQL_ENDPOINT = server.url + '/graphql';
      logDebug(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

      const apiKey = result.config.appSync.apiKey;
      logDebug(apiKey);
      GRAPHQL_CLIENT = new GraphQLClient(GRAPHQL_ENDPOINT, {
        'x-api-key': apiKey,
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  afterAll(async () => {
    try {
      if (server) {
        await server.stop();
      }
      await terminateDDB(ddbEmulator, dbPath);
    } catch (e) {
      logDebug(e);
      throw e;
    }
  });

  /**
   * Test queries below
   */

  test('Unnamed connection 1 way navigation, with @primaryKey directive 1:1', async () => {
    await GRAPHQL_CLIENT.query(
      `
      mutation CreateATeam {
          createATeam(input: {teamId: "T1", name: "Team 1"}) {
              teamId
              name
          }
      }
      `,
      {},
    );

    await GRAPHQL_CLIENT.query(
      `
      mutation CreateAProject {
          createAProject(input: {projectId: "P1", name: "P1", aProjectTeamId: "T1"}) {
              projectId
              name
          }
      }
      `,
      {},
    );

    const queryResponse = await GRAPHQL_CLIENT.query(
      `
      query ListAProjects {
          listAProjects {
              items {
                  projectId
                  name
                  team {
                      teamId
                      name
                  }
              }
          }
      }
      `,
      {},
    );
    expect(queryResponse.data.listAProjects).toBeDefined();
    const items = queryResponse.data.listAProjects.items;
    expect(items.length).toEqual(1);
    expect(items[0].projectId).toEqual('P1');
    expect(items[0].team).toBeDefined();
    expect(items[0].team.teamId).toEqual('T1');
  });

  test('Unnamed connection 1 way navigation, with @primaryKey directive 1:M', async () => {
    await GRAPHQL_CLIENT.query(
      `
      mutation CreateBProject {
          createBProject(input: {projectId: "P1", name: "P1"}) {
              projectId
              name
          }
      }
      `,
      {},
    );

    await GRAPHQL_CLIENT.query(
      `
      mutation CreateBTeam {
          createBTeam(input: {teamId: "T1", name: "Team 1", bProjectTeamsId: "P1"}) {
              teamId
              name
          }
      }
      `,
      {},
    );

    await GRAPHQL_CLIENT.query(
      `
      mutation CreateBTeam {
          createBTeam(input: {teamId: "T2", name: "Team 2", bProjectTeamsId: "P1"}) {
              teamId
              name
          }
      }
      `,
      {},
    );

    const queryResponse = await GRAPHQL_CLIENT.query(
      `
      query ListBProjects {
          listBProjects {
              items {
                  projectId
                  name
                  teams {
                      items {
                          teamId
                          name
                      }
                  }
              }
          }
      }
      `,
      {},
    );
    expect(queryResponse.data.listBProjects).toBeDefined();
    const items = queryResponse.data.listBProjects.items;
    expect(items.length).toEqual(1);
    expect(items[0].projectId).toEqual('P1');
    expect(items[0].teams).toBeDefined();
    expect(items[0].teams.items).toBeDefined();
    expect(items[0].teams.items.length).toEqual(2);
    expect(items[0].teams.items[0].teamId).toEqual('T1');
    expect(items[0].teams.items[1].teamId).toEqual('T2');
  });

  test('Named connection 2 way navigation, with with custom @primaryKey fields 1:1', async () => {
    await GRAPHQL_CLIENT.query(
      `
      mutation CreateCTeam {
          createCTeam(input: {teamId: "T1", name: "Team 1", cTeamProjectId: "P1"}) {
              teamId
              name
          }
      }
      `,
      {},
    );

    await GRAPHQL_CLIENT.query(
      `
      mutation CreateCProject {
          createCProject(input: {projectId: "P1", name: "P1", cProjectTeamId: "T1"}) {
              projectId
              name
          }
      }
      `,
      {},
    );

    const queryResponse = await GRAPHQL_CLIENT.query(
      `
      query ListCProjects {
          listCProjects {
              items {
                  projectId
                  name
                  team {
                      teamId
                      name
                      project {
                          projectId
                          name
                      }
                  }
              }
          }
      }
      `,
      {},
    );
    expect(queryResponse.data.listCProjects).toBeDefined();
    const items = queryResponse.data.listCProjects.items;
    expect(items.length).toEqual(1);
    expect(items[0].projectId).toEqual('P1');
    expect(items[0].team).toBeDefined();
    expect(items[0].team.teamId).toEqual('T1');
    expect(items[0].team.project).toBeDefined();
    expect(items[0].team.project.projectId).toEqual('P1');
  });

  test('Named connection 2 way navigation, with with custom @key fields 1:M', async () => {
    await GRAPHQL_CLIENT.query(
      `
      mutation CreateDProject {
          createDProject(input: {projectId: "P1", name: "P1"}) {
              projectId
              name
          }
      }
      `,
      {},
    );

    await GRAPHQL_CLIENT.query(
      `
      mutation CreateDTeam {
          createDTeam(input: {teamId: "T1", name: "Team 1", dTeamProjectId: "P1"}) {
              teamId
              name
          }
      }
      `,
      {},
    );

    await GRAPHQL_CLIENT.query(
      `
      mutation CreateDTeam {
          createDTeam(input: {teamId: "T2", name: "Team 2", dTeamProjectId: "P1"}) {
              teamId
              name
          }
      }
      `,
      {},
    );

    const queryResponse = await GRAPHQL_CLIENT.query(
      `
      query ListDProjects {
          listDProjects {
              items {
                  projectId
                  name
                  teams {
                      items {
                          teamId
                          name
                          project {
                              projectId
                              name
                          }
                      }
                  }
              }
          }
      }
      `,
      {},
    );
    expect(queryResponse.data.listDProjects).toBeDefined();
    const items = queryResponse.data.listDProjects.items;
    expect(items.length).toEqual(1);
    expect(items[0].projectId).toEqual('P1');
    expect(items[0].teams).toBeDefined();
    expect(items[0].teams.items).toBeDefined();
    expect(items[0].teams.items.length).toEqual(2);
    expect(items[0].teams.items[0].teamId).toEqual('T1');
    expect(items[0].teams.items[0].project).toBeDefined();
    expect(items[0].teams.items[0].project.projectId).toEqual('P1');
    expect(items[0].teams.items[1].teamId).toEqual('T2');
    expect(items[0].teams.items[1].project).toBeDefined();
    expect(items[0].teams.items[1].project.projectId).toEqual('P1');
  });
});
