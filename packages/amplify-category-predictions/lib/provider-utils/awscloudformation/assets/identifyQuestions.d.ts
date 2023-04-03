declare namespace _default {
    export { identifyAccess };
    export { adminTask };
    export { s3bucket };
}
export default _default;
declare function identifyAccess(options: any): {
    type: string;
    name: string;
    message: string;
    choices: {
        name: string;
        value: string;
    }[];
    default: any;
};
declare const adminTask: ({
    type: string;
    name: string;
    message: string;
    choices: {
        name: string;
        value: boolean;
    }[];
    default: string;
    when?: undefined;
} | {
    type: string;
    name: string;
    message: string;
    choices: {
        name: string;
        value: string;
    }[];
    when: (answers: any) => any;
    default: string;
})[];
declare namespace s3bucket {
    const key: string;
    const question: string;
    namespace validation {
        const operator: string;
        const value: string;
        const onErrorMsg: string;
    }
    const required: boolean;
}
//# sourceMappingURL=identifyQuestions.d.ts.map