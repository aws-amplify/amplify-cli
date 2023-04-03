export declare const schema = "\n#change: added actual type definition for public subscription levl\ntype Post @model (subscriptions: { level: public })\n@auth(rules: [{allow: owner}])\n{\n  id: ID!\n  owner: String\n  postname: String\n  content: String\n}";
export declare const subscription = "\n#extra\nsubscription OnCreatePost {\n  onCreatePost {\n    postname\n    content\n  }\n}";
export declare const mutations_subscription: string[];
export declare const expected_result_subscription: {
    onCreatePost: {
        postname: string;
        content: string;
    };
}[];
