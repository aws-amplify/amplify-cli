export declare enum AmplifyEvent {
    PreInit = "PreInit",
    PostInit = "PostInit",
    PreExport = "PreExport",
    PrePush = "PrePush",
    PostPush = "PostPush",
    PrePull = "PrePull",
    PostPull = "PostPull",
    PostEnvAdd = "PostEnvAdd",
    PreCodegenModels = "PreCodegenModels",
    PostCodegenModels = "PostCodegenModels",
    InternalOnlyPostEnvRemove = "InternalOnlyPostEnvRemove"
}
export interface AmplifyEventData {
    [AmplifyEvent.PreInit]: NoArgsAmplifyEventData;
    [AmplifyEvent.PostInit]: NoArgsAmplifyEventData;
    [AmplifyEvent.PreExport]: NoArgsAmplifyEventData;
    [AmplifyEvent.PrePush]: NoArgsAmplifyEventData;
    [AmplifyEvent.PostPush]: NoArgsAmplifyEventData;
    [AmplifyEvent.PrePull]: NoArgsAmplifyEventData;
    [AmplifyEvent.PostPull]: NoArgsAmplifyEventData;
    [AmplifyEvent.PostEnvAdd]: AmplifyPostEnvAddEventData;
    [AmplifyEvent.PreCodegenModels]: NoArgsAmplifyEventData;
    [AmplifyEvent.PostCodegenModels]: NoArgsAmplifyEventData;
    [AmplifyEvent.InternalOnlyPostEnvRemove]: AmplifyInternalOnlyPostEnvRemoveEventData;
}
export type NoArgsAmplifyEventData = Record<string, never>;
export interface AmplifyInternalOnlyPostEnvRemoveEventData {
    envName: string;
}
export interface AmplifyPostEnvAddEventData {
    prevEnvName: string;
    newEnvName: string;
}
export interface AmplifyEventArgs<T extends AmplifyEvent> {
    event: T;
    data?: AmplifyEventData[T];
}
//# sourceMappingURL=amplify-event.d.ts.map