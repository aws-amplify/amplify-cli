import { IFlowData } from '@aws-amplify/amplify-cli-shared-interfaces';
import { Validator } from './validators';
export declare const prompter: Prompter;
export declare const byValues: <T>(selection: T[], equals?: EqualsFunction<T>) => MultiFilterFunction<T>;
export declare const byValue: <T>(selection: T, equals?: EqualsFunction<T>) => SingleFilterFunction<T>;
type EqualsFunction<T> = (a: T, b: T) => boolean;
type Prompter = {
    confirmContinue: (message?: string) => Promise<boolean>;
    yesOrNo: (message: string, initial?: boolean) => Promise<boolean>;
    input: <RS extends ReturnSize = 'one', T = string>(message: string, ...options: MaybeOptionalInputOptions<RS, T>) => Promise<PromptReturn<RS, T>>;
    pick: <RS extends ReturnSize = 'one', T = string>(message: string, choices: Choices<T>, ...options: MaybeOptionalPickOptions<RS, T>) => Promise<PromptReturn<RS, T>>;
    setFlowData: (flowData: IFlowData) => void;
    getTotalPromptElapsedTime: () => number;
};
type MaybeAvailableHiddenInputOption<RS extends ReturnSize> = RS extends 'many' ? unknown : {
    hidden?: boolean;
};
type InitialSelectionOption<RS extends ReturnSize, T> = {
    initial?: RS extends 'one' ? number | SingleFilterFunction<T> : number[] | MultiFilterFunction<T>;
};
type SingleFilterFunction<T> = (arr: T[]) => number | undefined;
type MultiFilterFunction<T> = (arr: T[]) => number[];
type InitialValueOption<T> = {
    initial?: T;
};
type MultiSelectMinimum<RS extends ReturnSize> = RS extends 'one' ? unknown : {
    pickAtLeast?: number;
};
type MultiSelectMaximum<RS extends ReturnSize> = RS extends 'one' ? unknown : {
    pickAtMost?: number;
};
type ValidateValueOption = {
    validate?: Validator;
};
type TransformOption<T> = {
    transform: (value: string) => T | Promise<T>;
};
type MaybeOptionalTransformOption<T> = T extends string ? Partial<TransformOption<T>> : TransformOption<T>;
type ReturnSizeOption<RS extends ReturnSize> = RS extends 'many' ? {
    returnSize: 'many';
} : {
    returnSize?: 'one';
};
type Choices<T> = T extends string ? GenericChoice<T>[] | string[] : GenericChoice<T>[];
type GenericChoice<T> = {
    name: string;
    value: T;
    hint?: string;
    disabled?: boolean;
};
type ReturnSize = 'many' | 'one';
type MaybeOptionalInputOptions<RS extends ReturnSize, T> = RS extends 'many' ? [InputOptions<RS, T>] : T extends string ? [InputOptions<RS, T>?] : [InputOptions<RS, T>];
type MaybeOptionalPickOptions<RS extends ReturnSize, T> = RS extends 'many' ? [PickOptions<RS, T>] : [PickOptions<RS, T>?];
type PromptReturn<RS extends ReturnSize, T> = RS extends 'many' ? T[] : T;
type PickOptions<RS extends ReturnSize, T> = ReturnSizeOption<RS> & InitialSelectionOption<RS, T> & MultiSelectMaximum<RS> & MultiSelectMinimum<RS>;
type InputOptions<RS extends ReturnSize, T> = ReturnSizeOption<RS> & ValidateValueOption & InitialValueOption<T> & MaybeOptionalTransformOption<T> & MaybeAvailableHiddenInputOption<RS>;
export {};
//# sourceMappingURL=prompter.d.ts.map