import {
  addApiWithBlankSchemaAndConflictDetection,
  amplifyPush,
  configureAmplify,
  getApiKey,
  getConfiguredAppsyncClientAPIKeyAuth,
  updateApiSchema,
} from '@aws-amplify/amplify-e2e-core';
import { testMutations, testQueries } from '../common';

//schema
export const schemaName = 'selective_sync.graphql';
export const schema = `
type Comment @model
@key(name: "byUsername", fields: ["username", "createdAt"], queryField: "commentsByUsername")
@key(name: "byeditor", fields: ["editor", "createdAt"], queryField: "commentsByeditors")
{
  id: ID!
  content: String
  username: String!
  createdAt: String!
  editor: String!
  data1: String
  data2: String
}

##key/howTo4`;
//mutations
export const mutation1 = `
 mutation CreateComment{
    createComment(input: {
        content: "order1",
        username: "user2",
        createdAt: "2019-01-01T01:05:49.129Z",
        editor: "user1",
        data1 : "example1",
        data2 : "example2"
  }) {
      content
      username
      createdAt
      editor
      data1
      data2
    }
  }`;

export const mutation2 = `
  mutation CreateComment{
     createComment(input: {
         content: "order2",
         username: "user2",
         createdAt: "2018-01-01T01:05:49.129Z",
         editor: "user1",
         data1 : "example3",
         data2 : "example4"
   }) {
       content
       username
       createdAt
       editor
       data1
       data2
     }
   }`;

export const mutation3 = `
   mutation CreateComment{
      createComment(input: {
          content: "order3",
          username: "user2",
          createdAt: "2009-01-01T01:05:49.129Z",
          editor: "user3",
          data1 : "example5",
          data2 : "example6"
    }) {
        content
        username
        createdAt
        editor
        data1
        data2
      }
    }`;

export const mutation4 = `
    mutation CreateComment{
       createComment(input: {
           content: "order1",
           username: "user1",
           createdAt: "2015-01-01T01:05:49.129Z",
           editor: "user2",
           data1 : "example1",
           data2 : "example2"
     }) {
         content
         username
         createdAt
         editor
         data1
         data2
       }
     }`;

//query1 with no filter
export const query1 = `
query SyncComments {
  syncComments(filter: {and: [{username: {eq: "user2"}}, {createdAt: {gt: "2010-01-01T00:00Z"}}]}) {
    items {
      content
      createdAt
      editor
      data1
      data2
      editor
      username
    }
  }
}
`;
export const expected_result_query1 = {
  data: {
    syncComments: {
      items: [
        {
          content: 'order2',
          username: 'user2',
          createdAt: '2018-01-01T01:05:49.129Z',
          editor: 'user1',
          data1: 'example3',
          data2: 'example4',
        },
        {
          content: 'order1',
          username: 'user2',
          createdAt: '2019-01-01T01:05:49.129Z',
          editor: 'user1',
          data1: 'example1',
          data2: 'example2',
        },
      ],
    },
  },
};
//query1 with filter
export const query2 = `
query SyncComments {
  syncComments(filter: {and: [{username: {eq: "user2"}}, {createdAt: {gt: "2010-01-01T00:00Z"}}, { content: {eq : "order1"}}]}) {
    items {
      content
      createdAt
      editor
      data1
      data2
      editor
      username
    }
  }
}
`;
export const expected_result_query2 = {
  data: {
    syncComments: {
      items: [
        {
          content: 'order1',
          username: 'user2',
          createdAt: '2019-01-01T01:05:49.129Z',
          editor: 'user1',
          data1: 'example1',
          data2: 'example2',
        },
      ],
    },
  },
};

//query1 with no PK and all filter
export const query3 = `
query SyncComments {
  syncComments(filter: {and: [ {createdAt : {gt : "2019-01-01T00:00Z"}}]}) {
    items {
      content
      createdAt
      editor
      data1
      data2
      editor
      username
    }
  }
}
`;
export const expected_result_query3 = {
  data: {
    syncComments: {
      items: [
        {
          content: 'order1',
          username: 'user2',
          createdAt: '2019-01-01T01:05:49.129Z',
          editor: 'user1',
          data1: 'example1',
          data2: 'example2',
        },
      ],
    },
  },
};

//query1 with no PK and "or" filter
export const query4 = `
query SyncComments {
  syncComments(filter: {and: [ {data1 : {lt : "example4"}},{username : {eq : "user1"}}]}) {
    items {
      content
      createdAt
      editor
      data1
      data2
      editor
      username
    }
  }
}
`;
export const expected_result_query4 = {
  data: {
    syncComments: {
      items: [
        {
          content: 'order1',
          username: 'user1',
          createdAt: '2015-01-01T01:05:49.129Z',
          editor: 'user2',
          data1: 'example1',
          data2: 'example2',
        },
      ],
    },
  },
};

//query1 with no and and or in filter object
export const query5 = `
query SyncComments {
  syncComments(filter: { data1 : {lt : "example4"}, username : {eq : "user1"}}) {
    items {
      content
      createdAt
      editor
      data1
      data2
      editor
      username
    }
  }
}
`;
export const expected_result_query5 = {
  data: {
    syncComments: {
      items: [
        {
          content: 'order1',
          username: 'user1',
          createdAt: '2015-01-01T01:05:49.129Z',
          editor: 'user2',
          data1: 'example1',
          data2: 'example2',
        },
      ],
    },
  },
};

export async function runTest(projectDir: string, testModule: any, appName: string) {
  await addApiWithBlankSchemaAndConflictDetection(projectDir, { transformerVersion: 1 });
  await updateApiSchema(projectDir, appName, testModule.schemaName);
  await amplifyPush(projectDir);

  const awsconfig = configureAmplify(projectDir);
  const apiKey = getApiKey(projectDir);
  const appSyncClient = getConfiguredAppsyncClientAPIKeyAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);

  await testMutations(testModule, appSyncClient);
  await testQueries(testModule, appSyncClient);
}
