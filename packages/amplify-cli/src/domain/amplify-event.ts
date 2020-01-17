export type AmplifyEvent = string;

export class AmplifyEventData {}

export class AmplifyEventArgs {
  constructor(public event: AmplifyEvent, public data?: AmplifyEventData) {}
}

export enum AmplifyCoreEvent {
  PreInit = 'PreInit',
  PostInit = 'PostInit',
  PrePush = 'PrePush',
  PostPush = 'PostPush',
}
