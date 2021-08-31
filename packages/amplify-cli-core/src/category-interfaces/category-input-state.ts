import { $TSAny } from 'amplify-cli-core';

export abstract class CategoryInputState {
  _resourceName: string;
  constructor(resourceName: string) {
    this._resourceName = resourceName;
  }

  abstract getCliInputPayload(): $TSAny;
  abstract saveCliInputPayload(props: $TSAny): void;
  abstract isCLIInputsValid(props: $TSAny): void;
}
