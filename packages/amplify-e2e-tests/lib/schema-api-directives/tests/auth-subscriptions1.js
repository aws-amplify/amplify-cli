"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_subscription = exports.mutations_subscription = exports.subscription = exports.schema = void 0;
//schema
exports.schema = "\ntype Post @model\n@auth(rules: [{allow: owner}])\n{\n  id: ID!\n  owner: String\n  postname: String\n  content: String\n}";
//subscriptions
exports.subscription = "\n#error: syntax error\n#change: changed \"Bob\" to \"user1\"\n\nsubscription OnCreatePost {\n  onCreatePost(owner: \"user1\"){\n    postname\n    content\n  }\n}\n";
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
//# sourceMappingURL=auth-subscriptions1.js.map