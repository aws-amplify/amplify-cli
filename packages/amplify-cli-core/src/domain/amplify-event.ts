export enum AmplifyEvent {
    PreInit,
    PostInit,
    PreAddResource,
    PostAddResource,
    PreRemoveResource,
    PostRemoveResource,
    PrePush,
    PostPush,
    PreUpdateMeta,
    PostUpdateMeta,
}

// export enum AmplifyEvent {
//     PreInit = 'PreInit',
//     PostInit = 'PostInit',
//     PreAddResource = 'PreAddResource',
//     PostAddResource = 'PostAddResource',
//     PreRemoveResource = 'PreRemoveResource',
//     PostRemoveResource = 'PostRemoveResource',
//     PrePush = 'PrePush',
//     PostPush = 'PostPush',
//     PreUpdateMeta = 'PreUpdateMeta',
//     PostUpdateMeta = 'PostUpdateMeta',
// }

export class AmplifyEventData {
}

export class AmplifyPreInitEventData extends AmplifyEventData {
}

export class AmplifyPostInitEventData extends AmplifyEventData {
}

export class AmplifyPreAddResourceEventData extends AmplifyEventData {
}

export class AmplifyPostAddResourceEventData extends AmplifyEventData {
}

export class AmplifyPreRemoveResourceEventData extends AmplifyEventData {
}

export class AmplifyPostRemoveResourceEventData extends AmplifyEventData {
}

export class AmplifyPrePushEventData extends AmplifyEventData {
}

export class AmplifyPostPushEventData extends AmplifyEventData {
}

export class AmplifyPreUpdateMetaEventData extends AmplifyEventData {
}

export class AmplifyPostUpdateMetaEventData extends AmplifyEventData {
}


export class AmplifyEventArgs {
    constructor(
        public event: AmplifyEvent,
        public data?: AmplifyEventData
    ) {}
}