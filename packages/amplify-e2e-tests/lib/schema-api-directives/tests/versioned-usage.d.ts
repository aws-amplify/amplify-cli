export declare const schema = "\ntype Post @model @versioned {\n  id: ID!\n  title: String!\n  version: Int! # <- If not provided, it is added for you.\n}\n\n##versioned/usage";
export declare const mutation1 = "\n#change: add id: \"1\" in the input, so update mutation can be carried out\nmutation Create {\n  createPost(input: { \n    id: \"1\"\n    title: \"Conflict detection in the cloud!\" \n  }) {\n    id\n    title\n    version # will be 1\n  }\n}\n";
export declare const expected_result_mutation1: {
    data: {
        createPost: {
            id: string;
            title: string;
            version: number;
        };
    };
};
export declare const mutation2 = "\nmutation Update($postId: ID!) {\n  updatePost(input: { id: $postId, title: \"Conflict detection in the cloud is great!\", expectedVersion: 1 }) {\n    id\n    title\n    version # will be 2\n  }\n}\n";
export declare const input_mutation2: {
    postId: string;
};
export declare const expected_result_mutation2: {
    data: {
        updatePost: {
            id: string;
            title: string;
            version: number;
        };
    };
};
export declare const mutation3 = "\nmutation Delete($postId: ID!) {\n  deletePost(input: { id: $postId, expectedVersion: 2 }) {\n    id\n    title\n    version\n  }\n}\n";
export declare const input_mutation3: {
    postId: string;
};
export declare const expected_result_mutation3: {
    data: {
        deletePost: {
            id: string;
            title: string;
            version: number;
        };
    };
};
