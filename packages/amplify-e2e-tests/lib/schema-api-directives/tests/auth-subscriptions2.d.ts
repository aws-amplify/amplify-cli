export declare const schema = "\n#error: remove duplicate @model in doc\n#error: there's the ending \"{\" \ntype Post @model\n@auth(rules: [ {allow: groups, groups: [\"Admin\"]} ])\n{\n  id: ID!\n  owner: String\n  postname: String\n  content: String\n}";
export declare const subscription = "\n#extra\nsubscription OnCreatePost {\n  onCreatePost {\n    postname\n    content\n  }\n}";
export declare const mutations_subscription: string[];
export declare const expected_result_subscription: {
    onCreatePost: {
        postname: string;
        content: string;
    };
}[];
