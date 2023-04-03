declare namespace _default {
    export { setup };
    export { convertTypes };
    export { convertAccess };
    export { translateOptions };
    export { deniedCombos };
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
        validate: (value: any) => true | "Resource name should be alphanumeric!";
        default: any;
    };
}
declare namespace convertTypes {
    export { translateText };
    export { speechGenerator };
    export { transcription };
}
declare namespace convertAccess {
    function prompt(options: any): {
        type: string;
        name: string;
        message: string;
        choices: {
            name: string;
            value: string;
        }[];
        default: any;
    };
}
declare const translateOptions: {
    name: string;
    value: string;
}[];
declare const deniedCombos: {
    zh: string[];
    'zh-Tw': string[];
    ko: string[];
    no: string[];
};
declare namespace translateText {
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
    export function targetQuestion(targetOptions: any, options: any): {
        type: string;
        name: string;
        message: string;
        choices: any;
        default: any;
    };
    export const service: string;
    export { convertAccess as authAccess };
}
declare namespace speechGenerator {
    export function questions(options: any): {
        type: string;
        name: string;
        message: string;
        choices: any;
        default: any;
    };
    export function voiceQuestion(langID: any, options: any): {
        type: string;
        name: string;
        message: string;
        choices: any;
        default: any;
    };
    const service_1: string;
    export { service_1 as service };
    export { convertAccess as authAccess };
}
declare namespace transcription {
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
    const service_2: string;
    export { service_2 as service };
    export { convertAccess as authAccess };
}
//# sourceMappingURL=convertQuestions.d.ts.map