export const aliasAttributes: ({
    name: string;
    value: string;
    checked: boolean;
} | {
    name: string;
    value: string;
    checked?: undefined;
})[];
export const coreAttributes: {
    name: string;
    value: string;
}[];
export const appClientReadAttributes: {
    name: string;
    value: string;
}[];
export const authSelectionMap: {
    name: string;
    value: string;
}[];
export function getAllMaps(edit: any): {
    aliasAttributes: ({
        name: string;
        value: string;
        checked: boolean;
    } | {
        name: string;
        value: string;
        checked?: undefined;
    })[];
    coreAttributes: {
        name: string;
        value: string;
    }[];
    authSelectionMap: {
        name: string;
        value: string;
    }[];
    appClientReadAttributes: {
        name: string;
        value: string;
    }[];
    authProviders: {
        name: string;
        value: string;
        answerHashKey: string;
    }[];
    mfaOptions: {
        name: string;
        value: string;
    }[];
    mfaMethods: {
        name: string;
        value: string;
    }[];
    emailRegistration: {
        name: string;
        value: string[];
    }[];
    defaultPromptMap: {
        name: string;
        value: string;
    }[];
    booleanOptions: ({
        name: string;
        value: string;
    } | {
        name: string;
        value: boolean;
    })[];
    signInOptions: {
        name: string;
        value: string;
    }[];
    socialLoginOptions: ({
        name: string;
        value: string;
    } | {
        name: string;
        value: null;
    })[];
    hostedUIProviders: {
        name: string;
        value: string;
        key: string;
    }[];
    oAuthFlows: {
        name: string;
        value: string;
    }[];
    oAuthScopes: {
        name: string;
        value: string;
    }[];
    authorizeScopes: {
        name: string;
        value: string;
    }[];
    attributeProviderMap: {
        address: {
            facebook: {};
            google: {};
            loginwithamazon: {};
            signinwithapple: {};
        };
        birthdate: {
            facebook: {
                attr: string;
                scope: string;
            };
            google: {
                attr: string;
                scope: string;
            };
            loginwithamazon: {};
            signinwithapple: {};
        };
        email: {
            facebook: {
                attr: string;
                scope: string;
            };
            google: {
                attr: string;
                scope: string;
            };
            loginwithamazon: {
                attr: string;
                scope: string;
            };
            signinwithapple: {
                attr: string;
                scope: string;
            };
        };
        family_name: {
            facebook: {
                attr: string;
                scope: string;
            };
            google: {
                attr: string;
                scope: string;
            };
            loginwithamazon: {};
            signinwithapple: {
                attr: string;
                scope: string;
            };
        };
        gender: {
            facebook: {
                attr: string;
                scope: string;
            };
            google: {
                attr: string;
                scope: string;
            };
            loginwithamazon: {};
            signinwithapple: {};
        };
        given_name: {
            facebook: {
                attr: string;
                scope: string;
            };
            google: {
                attr: string;
                scope: string;
            };
            loginwithamazon: {};
            signinwithapple: {
                attr: string;
                scope: string;
            };
        };
        locale: {
            facebook: {};
            google: {};
            loginwithamazon: {
                attr: string;
                scope: string;
            };
            signinwithapple: {};
        };
        middle_name: {
            facebook: {
                attr: string;
                scope: string;
            };
            google: {};
            loginwithamazon: {};
            signinwithapple: {};
        };
        name: {
            facebook: {
                attr: string;
                scope: string;
            };
            google: {
                attr: string;
                scope: string;
            };
            loginwithamazon: {
                attr: string;
                scope: string;
            };
            signinwithapple: {
                attr: string;
                scope: string;
            };
        };
        nickname: {
            facebook: {};
            google: {};
            loginwithamazon: {};
            signinwithapple: {};
        };
        phone_number: {
            facebook: {};
            google: {
                attr: string;
                scope: string;
            };
            loginwithamazon: {};
            signinwithapple: {};
        };
        picture: {
            facebook: {
                attr: string;
                scope: string;
            };
            google: {
                attr: string;
                scope: string;
            };
            loginwithamazon: {};
            signinwithapple: {};
        };
        preferred_username: {
            facebook: {};
            google: {};
            loginwithamazon: {};
            signinwithapple: {};
        };
        profile: {
            facebook: {};
            google: {};
            loginwithamazon: {};
            signinwithapple: {};
        };
        zoneinfo: {
            facebook: {};
            google: {};
            loginwithamazon: {};
            signinwithapple: {};
        };
        website: {
            facebook: {};
            google: {};
            loginwithamazon: {};
            signinwithapple: {};
        };
        username: {
            facebook: {
                attr: string;
                scope: string;
            };
            google: {
                attr: string;
                scope: string;
            };
            loginwithamazon: {
                attr: string;
                scope: string;
            };
            signinwithapple: {};
        };
        updated_at: {
            facebook: {
                attr: string;
                scope: string;
            };
            google: {};
            loginwithamazon: {};
            signinwithapple: {};
        };
    };
    updateFlowMap: ({
        name: string;
        value: string;
        conditionKey: string;
        conditionMsg?: undefined;
    } | {
        name: string;
        value: string;
        conditionKey?: undefined;
        conditionMsg?: undefined;
    } | {
        name: string;
        value: string;
        conditionKey: string;
        conditionMsg: string;
    })[];
    capabilities: ({
        name: string;
        value: string;
        triggers: {
            DefineAuthChallenge: string[];
            CreateAuthChallenge: string[];
            VerifyAuthChallengeResponse: string[];
            CustomMessage?: undefined;
            PostConfirmation?: undefined;
            PreSignup?: undefined;
            PreTokenGeneration?: undefined;
        };
    } | {
        name: string;
        value: string;
        triggers: {
            CustomMessage: string[];
            DefineAuthChallenge?: undefined;
            CreateAuthChallenge?: undefined;
            VerifyAuthChallengeResponse?: undefined;
            PostConfirmation?: undefined;
            PreSignup?: undefined;
            PreTokenGeneration?: undefined;
        };
    } | {
        name: string;
        value: string;
        triggers: {
            PostConfirmation: string[];
            DefineAuthChallenge?: undefined;
            CreateAuthChallenge?: undefined;
            VerifyAuthChallengeResponse?: undefined;
            CustomMessage?: undefined;
            PreSignup?: undefined;
            PreTokenGeneration?: undefined;
        };
    } | {
        name: string;
        value: string;
        triggers: {
            PreSignup: string[];
            DefineAuthChallenge?: undefined;
            CreateAuthChallenge?: undefined;
            VerifyAuthChallengeResponse?: undefined;
            CustomMessage?: undefined;
            PostConfirmation?: undefined;
            PreTokenGeneration?: undefined;
        };
    } | {
        name: string;
        value: string;
        triggers: {
            PreTokenGeneration: string[];
            DefineAuthChallenge?: undefined;
            CreateAuthChallenge?: undefined;
            VerifyAuthChallengeResponse?: undefined;
            CustomMessage?: undefined;
            PostConfirmation?: undefined;
            PreSignup?: undefined;
        };
    })[];
    additionalConfigMap: {
        name: string;
        value: string[];
    }[];
};
export const authProviders: {
    name: string;
    value: string;
    answerHashKey: string;
}[];
export const mfaOptions: {
    name: string;
    value: string;
}[];
export const mfaMethods: {
    name: string;
    value: string;
}[];
export const emailRegistration: {
    name: string;
    value: string[];
}[];
export const defaultPromptMap: {
    name: string;
    value: string;
}[];
export const booleanOptions: ({
    name: string;
    value: string;
} | {
    name: string;
    value: boolean;
})[];
export const signInOptions: {
    name: string;
    value: string;
}[];
export const socialLoginOptions: ({
    name: string;
    value: string;
} | {
    name: string;
    value: null;
})[];
export const hostedUIProviders: {
    name: string;
    value: string;
    key: string;
}[];
export const authorizeScopes: {
    name: string;
    value: string;
}[];
export const oAuthFlows: {
    name: string;
    value: string;
}[];
export const oAuthScopes: {
    name: string;
    value: string;
}[];
export namespace messages {
    const authExists: string;
    const dependenciesExists: string;
}
export namespace attributeProviderMap {
    namespace address {
        const facebook: {};
        const google: {};
        const loginwithamazon: {};
        const signinwithapple: {};
    }
    namespace birthdate {
        export namespace facebook_1 {
            const attr: string;
            const scope: string;
        }
        export { facebook_1 as facebook };
        export namespace google_1 {
            const attr_1: string;
            export { attr_1 as attr };
            const scope_1: string;
            export { scope_1 as scope };
        }
        export { google_1 as google };
        const loginwithamazon_1: {};
        export { loginwithamazon_1 as loginwithamazon };
        const signinwithapple_1: {};
        export { signinwithapple_1 as signinwithapple };
    }
    namespace email {
        export namespace facebook_2 {
            const attr_2: string;
            export { attr_2 as attr };
            const scope_2: string;
            export { scope_2 as scope };
        }
        export { facebook_2 as facebook };
        export namespace google_2 {
            const attr_3: string;
            export { attr_3 as attr };
            const scope_3: string;
            export { scope_3 as scope };
        }
        export { google_2 as google };
        export namespace loginwithamazon_2 {
            const attr_4: string;
            export { attr_4 as attr };
            const scope_4: string;
            export { scope_4 as scope };
        }
        export { loginwithamazon_2 as loginwithamazon };
        export namespace signinwithapple_2 {
            const attr_5: string;
            export { attr_5 as attr };
            const scope_5: string;
            export { scope_5 as scope };
        }
        export { signinwithapple_2 as signinwithapple };
    }
    namespace family_name {
        export namespace facebook_3 {
            const attr_6: string;
            export { attr_6 as attr };
            const scope_6: string;
            export { scope_6 as scope };
        }
        export { facebook_3 as facebook };
        export namespace google_3 {
            const attr_7: string;
            export { attr_7 as attr };
            const scope_7: string;
            export { scope_7 as scope };
        }
        export { google_3 as google };
        const loginwithamazon_3: {};
        export { loginwithamazon_3 as loginwithamazon };
        export namespace signinwithapple_3 {
            const attr_8: string;
            export { attr_8 as attr };
            const scope_8: string;
            export { scope_8 as scope };
        }
        export { signinwithapple_3 as signinwithapple };
    }
    namespace gender {
        export namespace facebook_4 {
            const attr_9: string;
            export { attr_9 as attr };
            const scope_9: string;
            export { scope_9 as scope };
        }
        export { facebook_4 as facebook };
        export namespace google_4 {
            const attr_10: string;
            export { attr_10 as attr };
            const scope_10: string;
            export { scope_10 as scope };
        }
        export { google_4 as google };
        const loginwithamazon_4: {};
        export { loginwithamazon_4 as loginwithamazon };
        const signinwithapple_4: {};
        export { signinwithapple_4 as signinwithapple };
    }
    namespace given_name {
        export namespace facebook_5 {
            const attr_11: string;
            export { attr_11 as attr };
            const scope_11: string;
            export { scope_11 as scope };
        }
        export { facebook_5 as facebook };
        export namespace google_5 {
            const attr_12: string;
            export { attr_12 as attr };
            const scope_12: string;
            export { scope_12 as scope };
        }
        export { google_5 as google };
        const loginwithamazon_5: {};
        export { loginwithamazon_5 as loginwithamazon };
        export namespace signinwithapple_5 {
            const attr_13: string;
            export { attr_13 as attr };
            const scope_13: string;
            export { scope_13 as scope };
        }
        export { signinwithapple_5 as signinwithapple };
    }
    namespace locale {
        const facebook_6: {};
        export { facebook_6 as facebook };
        const google_6: {};
        export { google_6 as google };
        export namespace loginwithamazon_6 {
            const attr_14: string;
            export { attr_14 as attr };
            const scope_14: string;
            export { scope_14 as scope };
        }
        export { loginwithamazon_6 as loginwithamazon };
        const signinwithapple_6: {};
        export { signinwithapple_6 as signinwithapple };
    }
    namespace middle_name {
        export namespace facebook_7 {
            const attr_15: string;
            export { attr_15 as attr };
            const scope_15: string;
            export { scope_15 as scope };
        }
        export { facebook_7 as facebook };
        const google_7: {};
        export { google_7 as google };
        const loginwithamazon_7: {};
        export { loginwithamazon_7 as loginwithamazon };
        const signinwithapple_7: {};
        export { signinwithapple_7 as signinwithapple };
    }
    namespace name {
        export namespace facebook_8 {
            const attr_16: string;
            export { attr_16 as attr };
            const scope_16: string;
            export { scope_16 as scope };
        }
        export { facebook_8 as facebook };
        export namespace google_8 {
            const attr_17: string;
            export { attr_17 as attr };
            const scope_17: string;
            export { scope_17 as scope };
        }
        export { google_8 as google };
        export namespace loginwithamazon_8 {
            const attr_18: string;
            export { attr_18 as attr };
            const scope_18: string;
            export { scope_18 as scope };
        }
        export { loginwithamazon_8 as loginwithamazon };
        export namespace signinwithapple_8 {
            const attr_19: string;
            export { attr_19 as attr };
            const scope_19: string;
            export { scope_19 as scope };
        }
        export { signinwithapple_8 as signinwithapple };
    }
    namespace nickname {
        const facebook_9: {};
        export { facebook_9 as facebook };
        const google_9: {};
        export { google_9 as google };
        const loginwithamazon_9: {};
        export { loginwithamazon_9 as loginwithamazon };
        const signinwithapple_9: {};
        export { signinwithapple_9 as signinwithapple };
    }
    namespace phone_number {
        const facebook_10: {};
        export { facebook_10 as facebook };
        export namespace google_10 {
            const attr_20: string;
            export { attr_20 as attr };
            const scope_20: string;
            export { scope_20 as scope };
        }
        export { google_10 as google };
        const loginwithamazon_10: {};
        export { loginwithamazon_10 as loginwithamazon };
        const signinwithapple_10: {};
        export { signinwithapple_10 as signinwithapple };
    }
    namespace picture {
        export namespace facebook_11 {
            const attr_21: string;
            export { attr_21 as attr };
            const scope_21: string;
            export { scope_21 as scope };
        }
        export { facebook_11 as facebook };
        export namespace google_11 {
            const attr_22: string;
            export { attr_22 as attr };
            const scope_22: string;
            export { scope_22 as scope };
        }
        export { google_11 as google };
        const loginwithamazon_11: {};
        export { loginwithamazon_11 as loginwithamazon };
        const signinwithapple_11: {};
        export { signinwithapple_11 as signinwithapple };
    }
    namespace preferred_username {
        const facebook_12: {};
        export { facebook_12 as facebook };
        const google_12: {};
        export { google_12 as google };
        const loginwithamazon_12: {};
        export { loginwithamazon_12 as loginwithamazon };
        const signinwithapple_12: {};
        export { signinwithapple_12 as signinwithapple };
    }
    namespace profile {
        const facebook_13: {};
        export { facebook_13 as facebook };
        const google_13: {};
        export { google_13 as google };
        const loginwithamazon_13: {};
        export { loginwithamazon_13 as loginwithamazon };
        const signinwithapple_13: {};
        export { signinwithapple_13 as signinwithapple };
    }
    namespace zoneinfo {
        const facebook_14: {};
        export { facebook_14 as facebook };
        const google_14: {};
        export { google_14 as google };
        const loginwithamazon_14: {};
        export { loginwithamazon_14 as loginwithamazon };
        const signinwithapple_14: {};
        export { signinwithapple_14 as signinwithapple };
    }
    namespace website {
        const facebook_15: {};
        export { facebook_15 as facebook };
        const google_15: {};
        export { google_15 as google };
        const loginwithamazon_15: {};
        export { loginwithamazon_15 as loginwithamazon };
        const signinwithapple_15: {};
        export { signinwithapple_15 as signinwithapple };
    }
    namespace username {
        export namespace facebook_16 {
            const attr_23: string;
            export { attr_23 as attr };
            const scope_23: string;
            export { scope_23 as scope };
        }
        export { facebook_16 as facebook };
        export namespace google_16 {
            const attr_24: string;
            export { attr_24 as attr };
            const scope_24: string;
            export { scope_24 as scope };
        }
        export { google_16 as google };
        export namespace loginwithamazon_16 {
            const attr_25: string;
            export { attr_25 as attr };
            const scope_25: string;
            export { scope_25 as scope };
        }
        export { loginwithamazon_16 as loginwithamazon };
        const signinwithapple_16: {};
        export { signinwithapple_16 as signinwithapple };
    }
    namespace updated_at {
        export namespace facebook_17 {
            const attr_26: string;
            export { attr_26 as attr };
            const scope_26: string;
            export { scope_26 as scope };
        }
        export { facebook_17 as facebook };
        const google_17: {};
        export { google_17 as google };
        const loginwithamazon_17: {};
        export { loginwithamazon_17 as loginwithamazon };
        const signinwithapple_17: {};
        export { signinwithapple_17 as signinwithapple };
    }
}
export const updateFlowMap: ({
    name: string;
    value: string;
    conditionKey: string;
    conditionMsg?: undefined;
} | {
    name: string;
    value: string;
    conditionKey?: undefined;
    conditionMsg?: undefined;
} | {
    name: string;
    value: string;
    conditionKey: string;
    conditionMsg: string;
})[];
export const capabilities: ({
    name: string;
    value: string;
    triggers: {
        DefineAuthChallenge: string[];
        CreateAuthChallenge: string[];
        VerifyAuthChallengeResponse: string[];
        CustomMessage?: undefined;
        PostConfirmation?: undefined;
        PreSignup?: undefined;
        PreTokenGeneration?: undefined;
    };
} | {
    name: string;
    value: string;
    triggers: {
        CustomMessage: string[];
        DefineAuthChallenge?: undefined;
        CreateAuthChallenge?: undefined;
        VerifyAuthChallengeResponse?: undefined;
        PostConfirmation?: undefined;
        PreSignup?: undefined;
        PreTokenGeneration?: undefined;
    };
} | {
    name: string;
    value: string;
    triggers: {
        PostConfirmation: string[];
        DefineAuthChallenge?: undefined;
        CreateAuthChallenge?: undefined;
        VerifyAuthChallengeResponse?: undefined;
        CustomMessage?: undefined;
        PreSignup?: undefined;
        PreTokenGeneration?: undefined;
    };
} | {
    name: string;
    value: string;
    triggers: {
        PreSignup: string[];
        DefineAuthChallenge?: undefined;
        CreateAuthChallenge?: undefined;
        VerifyAuthChallengeResponse?: undefined;
        CustomMessage?: undefined;
        PostConfirmation?: undefined;
        PreTokenGeneration?: undefined;
    };
} | {
    name: string;
    value: string;
    triggers: {
        PreTokenGeneration: string[];
        DefineAuthChallenge?: undefined;
        CreateAuthChallenge?: undefined;
        VerifyAuthChallengeResponse?: undefined;
        CustomMessage?: undefined;
        PostConfirmation?: undefined;
        PreSignup?: undefined;
    };
})[];
export const additionalConfigMap: {
    name: string;
    value: string[];
}[];
//# sourceMappingURL=string-maps.d.ts.map