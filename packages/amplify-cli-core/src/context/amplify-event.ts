/* eslint-disable max-classes-per-file */
/**
 * amplify events enum type
 */
export enum AmplifyEvent {
  PreInit = 'PreInit',
  PostInit = 'PostInit',
  PreExport = 'PreExport',
  PrePush = 'PrePush',
  PostPush = 'PostPush',
  PrePull = 'PrePull',
  PostPull = 'PostPull',
  PostEnvAdd = 'PostEnvAdd',
  PreCodegenModels = 'PreCodegenModels',
  PostCodegenModels = 'PostCodegenModels',
  InternalOnlyPostEnvRemove = 'InternalOnlyPostEnvRemove',
}

export class AmplifyEventData {}

export class AmplifyPreInitEventData extends AmplifyEventData {}

export class AmplifyPostInitEventData extends AmplifyEventData {}

export class AmplifyPrePushEventData extends AmplifyEventData {}

export class AmplifyPostPushEventData extends AmplifyEventData {}

export class AmplifyPrePullEventData extends AmplifyEventData {}

export class AmplifyPostPullEventData extends AmplifyEventData {}

export class AmplifyPreCodegenModelsEventData extends AmplifyEventData {}

export class AmplifyPostCodegenModelsEventData extends AmplifyEventData {}

export class AmplifyInternalOnlyPostEnvRemoveEventData extends AmplifyEventData {
  constructor(public readonly envName: string) {
    super();
  }
}

export class AmplifyPostEnvAddEventData extends AmplifyEventData {
  constructor(public readonly prevEnvName: string, public readonly newEnvName: string) {
    super();
  }
}
export class AmplifyEventArgs {
  constructor(public event: AmplifyEvent, public data?: AmplifyEventData) {}
}
