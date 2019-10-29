const graphQlToAmplifyConfig = require('../../../src/codegen-config/utils/graphQlToAmplifyConfig');

describe('graphQlToAmplifyConfig', () => {
  const schemaPath = './src/schema.json';
  const includes = ['**/*.gql'];
  const excludes = ['temp/**/*.gql'];
  const graphQLApiId = 'gql-api-id';
  const codeGenTarget = 'typescript';

  const projectName = 'proj1';
  const schemaPath1 = './proj1/schema.json';
  const includes1 = ['proj/**/*.gql'];
  const excludes1 = ['proj/temp/**/*.gql'];
  const graphQLApiId1 = 'proj1';
  const codeGenTarget1 = 'flow';

  it('should return items with amplify extensions', () => {
    const projects = {
      [projectName]: {
        config: {
          schemaPath: schemaPath1,
          includes: includes1,
          excludes: excludes1,
          extensions: {
            amplify: {
              codeGenTarget: codeGenTarget1,
              graphQLApiId: graphQLApiId1,
            },
          },
        },
      },
      proj2: {
        schemaPath,
        includes: includes1,
      },
    };

    const getProjects = jest.fn().mockReturnValue(projects);

    const gqlConfig = {
      config: {
        schemaPath,
        includes,
        excludes,
        extensions: {
          amplify: {
            codeGenTarget,
            graphQLApiId,
          },
        },
      },
      getProjects,
    };

    const expectedAmplifyConfig = [
      {
        schema: schemaPath,
        __root__: true,
        includes,
        excludes,
        amplifyExtension: {
          graphQLApiId,
          codeGenTarget,
        },
      },
      {
        schema: schemaPath1,
        __root__: false,
        projectName,
        includes: includes1,
        excludes: excludes1,
        amplifyExtension: {
          graphQLApiId: graphQLApiId1,
          codeGenTarget: codeGenTarget1,
        },
      },
    ];

    expect(graphQlToAmplifyConfig(gqlConfig)).toEqual(expectedAmplifyConfig);
  });
});
