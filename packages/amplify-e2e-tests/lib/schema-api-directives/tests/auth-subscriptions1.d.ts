export declare const schema = "\ntype Post @model\n@auth(rules: [{allow: owner}])\n{\n  id: ID!\n  owner: String\n  postname: String\n  content: String\n}";
export declare const subscription = "\n#error: syntax error\n#change: changed \"Bob\" to \"user1\"\n\nsubscription OnCreatePost {\n  onCreatePost(owner: \"user1\"){\n    postname\n    content\n  }\n}\n";
export declare const mutations_subscription: string[];
export declare const expected_result_subscription: {
    onCreatePost: {
        postname: string;
        content: string;
    };
}[];
