declare namespace _default {
    export { setup };
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
//# sourceMappingURL=inferQuestions.d.ts.map