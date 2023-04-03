import { $TSAny } from '..';
export declare abstract class CategoryInputState {
    _resourceName: string;
    constructor(resourceName: string);
    abstract getCLIInputPayload(): $TSAny;
    abstract saveCLIInputPayload(props: $TSAny): void;
    abstract isCLIInputsValid(props: $TSAny): void;
}
//# sourceMappingURL=category-input-state.d.ts.map