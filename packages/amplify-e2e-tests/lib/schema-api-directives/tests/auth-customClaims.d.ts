export declare function runTest(projectDir: string, testModule: any): Promise<void>;
export declare function updateTriggerHandler(projectDir: string): void;
export declare const schema = "\n#error: two @model on type Post\n#change: removed on @model\n\ntype Post\n@model\n@auth(rules: [\n\t{allow: owner, identityClaim: \"user_id\"},\n\t{allow: groups, groups: [\"Moderator\"], groupClaim: \"user_groups\"}\n])\n{\n  id: ID!\n  owner: String\n  postname: String\n  content: String\n}\n\n##customClaims";
export declare const func = "\nexports.handler = async event => {\n  event.response = {\n    claimsOverrideDetails: {\n      claimsToAddOrOverride: {\n        user_id: event.userName\n      }\n    }\n  };\n  return event;\n};\n";
export declare const createPostMutation = "\nmutation CreatePost {\n  createPost(input: {\n    id: \"1\",\n    postname: \"post1\",\n    content: \"post1 content\"\n  }) {\n    id\n    owner\n    postname\n    content\n    createdAt\n    updatedAt\n  }\n}\n";
export declare const expected_result_createPostMutation: {
    data: {
        createPost: {
            id: string;
            owner: string;
            postname: string;
            content: string;
            createdAt: string;
            updatedAt: string;
        };
    };
};
