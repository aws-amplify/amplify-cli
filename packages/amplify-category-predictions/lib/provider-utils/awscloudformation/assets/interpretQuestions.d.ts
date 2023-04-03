declare namespace _default {
    export { setup };
    export { interpretAccess };
    export { interpretText };
}
export default _default;
declare namespace setup {
    function type(): {
        type: string;
        name: string;
        message: string;
        choices: {
            name: string;
            value: string;
        }[];
    };
    function name(defaultName: any): {
        name: string;
        message: string;
        validate: import("@aws-amplify/amplify-prompts").Validator;
        default: any;
    };
}
declare function interpretAccess(options: any): {
    type: string;
    name: string;
    message: string;
    choices: {
        name: string;
        value: string;
    }[];
    default: any;
};
declare namespace interpretText {
    export function questions(options: any): {
        type: string;
        name: string;
        message: string;
        choices: {
            name: string;
            value: string;
        }[];
        default: any;
    };
    export { interpretAccess as auth };
}
//# sourceMappingURL=interpretQuestions.d.ts.map