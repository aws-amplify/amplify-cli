export declare const schemaName = "selective_sync.graphql";
export declare const schema = "\ntype Comment @model\n@key(name: \"byUsername\", fields: [\"username\", \"createdAt\"], queryField: \"commentsByUsername\")\n@key(name: \"byeditor\", fields: [\"editor\", \"createdAt\"], queryField: \"commentsByeditors\")\n{\n  id: ID!\n  content: String\n  username: String!\n  createdAt: String!\n  editor: String!\n  data1: String\n  data2: String\n}\n\n##key/howTo4";
export declare const mutation1 = "\n mutation CreateComment{\n    createComment(input: {\n        content: \"order1\",\n        username: \"user2\",\n        createdAt: \"2019-01-01T01:05:49.129Z\",\n        editor: \"user1\",\n        data1 : \"example1\",\n        data2 : \"example2\"\n  }) {\n      content\n      username\n      createdAt\n      editor\n      data1\n      data2\n    }\n  }";
export declare const mutation2 = "\n  mutation CreateComment{\n     createComment(input: {\n         content: \"order2\",\n         username: \"user2\",\n         createdAt: \"2018-01-01T01:05:49.129Z\",\n         editor: \"user1\",\n         data1 : \"example3\",\n         data2 : \"example4\"\n   }) {\n       content\n       username\n       createdAt\n       editor\n       data1\n       data2\n     }\n   }";
export declare const mutation3 = "\n   mutation CreateComment{\n      createComment(input: {\n          content: \"order3\",\n          username: \"user2\",\n          createdAt: \"2009-01-01T01:05:49.129Z\",\n          editor: \"user3\",\n          data1 : \"example5\",\n          data2 : \"example6\"\n    }) {\n        content\n        username\n        createdAt\n        editor\n        data1\n        data2\n      }\n    }";
export declare const mutation4 = "\n    mutation CreateComment{\n       createComment(input: {\n           content: \"order1\",\n           username: \"user1\",\n           createdAt: \"2015-01-01T01:05:49.129Z\",\n           editor: \"user2\",\n           data1 : \"example1\",\n           data2 : \"example2\"\n     }) {\n         content\n         username\n         createdAt\n         editor\n         data1\n         data2\n       }\n     }";
export declare const query1 = "\nquery SyncComments {\n  syncComments(filter: {and: [{username: {eq: \"user2\"}}, {createdAt: {gt: \"2010-01-01T00:00Z\"}}]}) {\n    items {\n      content\n      createdAt\n      editor\n      data1\n      data2\n      editor\n      username\n    }\n  }\n}\n";
export declare const expected_result_query1: {
    data: {
        syncComments: {
            items: {
                content: string;
                username: string;
                createdAt: string;
                editor: string;
                data1: string;
                data2: string;
            }[];
        };
    };
};
export declare const query2 = "\nquery SyncComments {\n  syncComments(filter: {and: [{username: {eq: \"user2\"}}, {createdAt: {gt: \"2010-01-01T00:00Z\"}}, { content: {eq : \"order1\"}}]}) {\n    items {\n      content\n      createdAt\n      editor\n      data1\n      data2\n      editor\n      username\n    }\n  }\n}\n";
export declare const expected_result_query2: {
    data: {
        syncComments: {
            items: {
                content: string;
                username: string;
                createdAt: string;
                editor: string;
                data1: string;
                data2: string;
            }[];
        };
    };
};
export declare const query3 = "\nquery SyncComments {\n  syncComments(filter: {and: [ {createdAt : {gt : \"2019-01-01T00:00Z\"}}]}) {\n    items {\n      content\n      createdAt\n      editor\n      data1\n      data2\n      editor\n      username\n    }\n  }\n}\n";
export declare const expected_result_query3: {
    data: {
        syncComments: {
            items: {
                content: string;
                username: string;
                createdAt: string;
                editor: string;
                data1: string;
                data2: string;
            }[];
        };
    };
};
export declare const query4 = "\nquery SyncComments {\n  syncComments(filter: {and: [ {data1 : {lt : \"example4\"}},{username : {eq : \"user1\"}}]}) {\n    items {\n      content\n      createdAt\n      editor\n      data1\n      data2\n      editor\n      username\n    }\n  }\n}\n";
export declare const expected_result_query4: {
    data: {
        syncComments: {
            items: {
                content: string;
                username: string;
                createdAt: string;
                editor: string;
                data1: string;
                data2: string;
            }[];
        };
    };
};
export declare const query5 = "\nquery SyncComments {\n  syncComments(filter: { data1 : {lt : \"example4\"}, username : {eq : \"user1\"}}) {\n    items {\n      content\n      createdAt\n      editor\n      data1\n      data2\n      editor\n      username\n    }\n  }\n}\n";
export declare const expected_result_query5: {
    data: {
        syncComments: {
            items: {
                content: string;
                username: string;
                createdAt: string;
                editor: string;
                data1: string;
                data2: string;
            }[];
        };
    };
};
export declare function runTest(projectDir: string, testModule: any, appName: string): Promise<void>;
