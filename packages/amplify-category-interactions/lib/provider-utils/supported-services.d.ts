export type LexSlotType = {
    slotType: string;
    slotTypeDescription?: string;
    slotValues?: string[];
    customType?: boolean;
};
export type LexSlot = {
    name: string;
    type: string;
    prompt: string;
    required: boolean;
    customType: boolean;
};
export type LexSample = {
    cancelMessage: string;
    confirmationQuestion: string;
    slots: LexSlot[];
    utterances: string[];
    intentName: string;
    newSlotTypes: LexSlotType[];
};
export type LexSamples = {
    [key: string]: LexSample[];
};
export declare const servicesMetadata: {
    Lex: {
        samples: LexSamples;
        defaultValuesFilename: string;
        serviceWalkthroughFilename: string;
        cfnFilename: string;
        provider: string;
    };
};
//# sourceMappingURL=supported-services.d.ts.map