export declare function runTest(projectDir: string, testModule: any): Promise<void>;
export declare function updateTriggerHandler(projectDir: string): void;
export declare const schema = "\n#error: two @model on type Post\n#change: removed on @model\ntype Post\n@model\n@auth(rules: [\n  {allow: owner, identityClaim: \"username\"},\n  {allow: groups, groups: [\"Moderator\"], groupClaim: \"user_groups\"}\n])\n{\n  id: ID!\n  owner: String\n  name: String\n  content: String\n}\n##customClaims";
export declare const func = "\nexports.handler = async event => {\n  event.response = {\n    claimsOverrideDetails: {\n      claimsToAddOrOverride: {\n        username: event.userName\n      }\n    }\n  };\n  return event;\n};\n";
export declare const createPostMutation = "\nmutation CreatePost {\n  createPost(input: {\n    id: \"1\",\n    name: \"post1\",\n    content: \"post1 content\"\n  }) {\n    id\n    owner\n    name\n    content\n    createdAt\n    updatedAt\n  }\n}\n";
export declare const expectedResultCreatePostMutation: {
    data: {
        createPost: {
            id: string;
            owner: string;
            name: string;
            content: string;
            createdAt: string;
            updatedAt: string;
        };
    };
};
