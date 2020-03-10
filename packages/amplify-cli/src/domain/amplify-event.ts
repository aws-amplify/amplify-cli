export enum AmplifyEvent {
  PreInit = 'PreInit',
  PostInit = 'PostInit',
  PrePush = 'PrePush',
  PostPush = 'PostPush',
  PrePull = 'PrePull',
  PostPull = 'PostPull',
}

export class AmplifyEventData {}

export class AmplifyPreInitEventData extends AmplifyEventData {}

export class AmplifyPostInitEventData extends AmplifyEventData {}

export class AmplifyPrePushEventData extends AmplifyEventData {}

export class AmplifyPostPushEventData extends AmplifyEventData {}

export class AmplifyPrePullEventData extends AmplifyEventData {}

export class AmplifyPostPullEventData extends AmplifyEventData {}

export class AmplifyEventArgs {
  constructor(public event: AmplifyEvent, public data?: AmplifyEventData) {}
}
