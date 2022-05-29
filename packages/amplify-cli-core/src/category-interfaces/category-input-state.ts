import { $TSAny } from '..';

export abstract class CategoryInputState {
  _resourceName: string;
  constructor(resourceName: string) {
    this._resourceName = resourceName;
  }

  abstract getCLIInputPayload(): $TSAny;
  abstract saveCLIInputPayload(props: $TSAny): void;
  abstract isCLIInputsValid(props: $TSAny): void;
}
