export declare const getStatusToErrorMsg: (status: any) => any;
export declare const collectStackErrorMessages: (eventsWithFailure: any) => string;
export declare const serializeErrorMessages: (errorMessages: CFNErrorMessages) => string;
export declare const deserializeErrorMessages: (errorDetails: string) => CFNErrorMessages;
export type CFNErrorMessage = {
    name: string;
    eventType: string;
    reason: string;
};
export type CFNErrorMessages = {
    messages: Array<CFNErrorMessage>;
};
//# sourceMappingURL=cloudformation-error-serializer.d.ts.map