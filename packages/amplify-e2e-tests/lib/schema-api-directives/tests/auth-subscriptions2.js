"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_subscription = exports.mutations_subscription = exports.subscription = exports.schema = void 0;
//schema
exports.schema = "\n#error: remove duplicate @model in doc\n#error: there's the ending \"{\" \ntype Post @model\n@auth(rules: [ {allow: groups, groups: [\"Admin\"]} ])\n{\n  id: ID!\n  owner: String\n  postname: String\n  content: String\n}";
//subscriptions
exports.subscription = "\n#extra\nsubscription OnCreatePost {\n  onCreatePost {\n    postname\n    content\n  }\n}";
exports.mutations_subscription = [
    "#extra\nmutation CreatePost {\n    createPost(input: { \n        postname: \"post1\",\n        content: \"post1 content\"\n    }) {\n        id\n        owner \n        postname\n        content\n    }\n}",
    "#extra\nmutation CreatePost {\n    createPost(input: { \n        postname: \"post2\",\n        content: \"post2 content\"\n    }) {\n        id\n        owner \n        postname\n        content\n    }\n}",
];
exports.expected_result_subscription = [
    {
        onCreatePost: {
            postname: 'post1',
            content: 'post1 content',
        },
    },
    {
        onCreatePost: {
            postname: 'post2',
            content: 'post2 content',
        },
    },
];
//# sourceMappingURL=auth-subscriptions2.js.map