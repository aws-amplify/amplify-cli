import { 
  addApi, 
  amplifyPush,
} from 'amplify-e2e-core';

import {
  getApiKey,
  configureAmplify,
  getConfiguredAppsyncClientAPIKeyAuth,
} from '../authHelper';

import {
  updateSchemaInTestProject,
  testMutations,
  testQueries,
} from '../common';


export async function runTest(projectDir: string, testModule: any) {
  await addApi(projectDir);
  updateSchemaInTestProject(projectDir, testModule.schema);
  await amplifyPush(projectDir);
  await new Promise(res => setTimeout(() => res(), 60000));

  const awsconfig = configureAmplify(projectDir);
  const apiKey = getApiKey(projectDir);
  const appSyncClient = getConfiguredAppsyncClientAPIKeyAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);

  await testMutations(testModule, appSyncClient);
  await new Promise(res => setTimeout(() => res(), 60000));
  await testQueries(testModule, appSyncClient);
}

//schema
export const schema = `
type Post @model @searchable {
  id: ID!
  title: String!
  createdAt: String!
  updatedAt: String!
  upvotes: Int
}`;

//mutations
export const mutation = `
mutation CreatePost {
  createPost(input: { title: "Stream me to Elasticsearch!" }) {
    id
    title
    createdAt
    updatedAt
    upvotes
  }
}`;

export const expected_result_mutation = {
  data: {
    createPost: {
      id: '<check-defined>',
      title: 'Stream me to Elasticsearch!',
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
      upvotes: null,
    },
  },
};

//queries
//#error: add "s" for searchPosts
export const query1 = `
#error: add "s" for searchPosts
query SearchPosts {
  searchPosts(filter: { title: { match: "Stream" }}) {
    items {
      id
      title
    }
  }
}`;
export const expected_result_query1 = {
  data: {
    searchPosts: {
      items: [
        {
          id: '<check-defined>',
          title: 'Stream me to Elasticsearch!',
        },
      ],
    },
  },
};

export const query2 = `
#error: add "s" for searchPosts
query SearchPosts {
  searchPosts(filter: { title: { wildcard: "S*Elasticsearch!" }}) {
    items {
      id
      title
    }
  }
}`;
//#error: wildcard is not working properly, the query does not contain the expected items
export const expected_result_query2 = {
  data: {
    searchPosts: {
      items: [],
    },
  },
};
