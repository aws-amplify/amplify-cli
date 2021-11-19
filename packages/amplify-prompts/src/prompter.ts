import { prompt } from 'enquirer';
// enquirer actions are not part of the TS types, but they are the recommended way to override enquirer behavior
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as actions from 'enquirer/lib/combos';
import { isYes } from './flags';
import { Validator } from './validators';
import { printer } from './printer';
import chalk from 'chalk';

/**
 * Provides methods for collecting interactive customer responses from the shell
 */
class AmplifyPrompter implements Prompter {
  constructor(private readonly prompter: typeof prompt = prompt, private readonly print: typeof printer = printer) {}

  /**
   * Asks a continue prompt.
   * Similar to yesOrNo, but 'false' is always the default and if the --yes flag is set, the prompt is skipped and 'true' is returned
   */
  confirmContinue = async (message: string = 'Do you want to continue?') => {
    if (isYes) {
      return true;
    }
    return this.yesOrNoCommon(message, false);
  };

  /**
   * Asks a yes or no question.
   * If the --yes flag is set, the prompt is skipped and the initial value is returned
   */
  yesOrNo = async (message: string, initial: boolean = true) => {
    if (isYes) {
      return initial;
    }
    return this.yesOrNoCommon(message, initial);
  };

  private yesOrNoCommon = async (message: string, initial: boolean) => {
    let submitted = false;
    const { result } = await this.prompter<{ result: boolean }>({
      type: 'confirm',
      name: 'result',
      message,
      format: value => (submitted ? (value ? 'yes' : 'no') : ''),
      onSubmit: () => (submitted = true),
      initial,
    });
    return result;
  };

  /**
   * Prompt for an input.
   * By default the input is a string, but can be any type.
   * If the type is not a string, the transform function is required to map the prompt response (which is always a string) to the expected return type
   *
   * If a ReturnSize of 'many' is specified, then the input is treated as a comma-delimited list and returned as an array.
   * The validate and transform functions will be applied to each element in the list individually
   *
   * If the yes flag is set, the initial value is returned. If no initial value is specified, an error is thrown
   * @param message The prompt message
   * @param options Prompt options. options.transform is required if T !== string
   * @returns The prompt response
   */
  input = async <RS extends ReturnSize = 'one', T = string>(message: string, ...options: MaybeOptionalInputOptions<RS, T>) => {
    const opts = options?.[0];
    if (isYes) {
      if (opts?.initial) {
        return opts.initial as PromptReturn<RS, T>;
      } else {
        throw new Error(`Cannot prompt for [${message}] when '--yes' flag is set`);
      }
    }

    const validator = (opts?.returnSize === 'many' ? validateEachWith(opts?.validate) : opts?.validate) as ValidatorCast;

    const { result } = await this.prompter<{ result: RS extends 'many' ? string[] : string }>({
      type: (opts as any)?.hidden ? 'invisible' : opts?.returnSize === 'many' ? 'list' : 'input',
      name: 'result',
      message,
      validate: validator,
      initial: opts?.initial,
      // footer is not part of the TS interface but it's part of the JS API
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      footer: opts?.returnSize === 'many' ? 'Enter a comma-delimited list of values' : undefined,
    });

    if (typeof opts?.transform === 'function') {
      if (Array.isArray(result)) {
        return (await Promise.all(result.map(async part => (opts.transform as Function)(part) as T))) as PromptReturn<RS, T>;
      }
      return opts.transform(result as string) as unknown as PromptReturn<RS, T>;
    } else {
      return result as unknown as PromptReturn<RS, T>;
    }
  };

  /**
   * Pick item(s) from a selection set.
   *
   * If only one choice is provided in the choices list, that choice is returned without a prompt
   * If the yes flag is set, the initial selection is returned. If no initial selection is specified, an error is thrown
   * @param message The prompt message
   * @param choices The selection set to choose from
   * @param options Control prompt settings
   * @returns The item(s) selected. If PickType = 'one' this is a single value. If PickType = 'many', this is an array
   *
   * Note: due to this TS issue https://github.com/microsoft/TypeScript/issues/30611 type T cannot be an enum.
   * If using an enum as the value type for a selection use T = string and assert the return type as the enum type.
   */
  pick = async <RS extends ReturnSize = 'one', T = string>(
    message: string,
    choices: Choices<T>,
    ...options: MaybeOptionalPickOptions<RS, T>
  ): Promise<PromptReturn<RS, T>> => {
    // some choices must be provided
    if (choices?.length === 0) {
      throw new Error(`No choices provided for prompt [${message}]`);
    }

    const opts = options?.[0];

    // map string[] choices into GenericChoice<T>[]
    const genericChoices: GenericChoice<T>[] =
      typeof choices[0] === 'string'
        ? ((choices as string[]).map(choice => ({ name: choice, value: choice })) as unknown as GenericChoice<T>[]) // this assertion is safe because the choice array can only be a string[] if the generic type is a string
        : (choices as GenericChoice<T>[]);

    const initialIndexes = initialOptsToIndexes(
      genericChoices.map(choice => choice.value),
      opts?.initial,
    );

    // enquirer requires all choice values be strings, so set up a mapping of string => T
    // and format choices to conform to enquirer's interface
    const choiceValueMap = new Map<string, T>();
    const enquirerChoices = genericChoices.map(choice => {
      choiceValueMap.set(choice.name, choice.value);
      return { name: choice.name, disabled: choice.disabled, hint: choice.hint };
    });

    actions.ctrl.a = 'a';

    let result = genericChoices[0].name as string | string[];

    if (choices?.length === 1) {
      this.print.info(`Only one option for [${message}]. Selecting [${result}].`);
    } else if (isYes) {
      if (initialIndexes === undefined || (Array.isArray(initialIndexes) && initialIndexes.length === 0)) {
        throw new Error(`Cannot prompt for [${message}] when '--yes' flag is set`);
      }
      if (typeof initialIndexes === 'number') {
        result = genericChoices[initialIndexes].name;
      } else {
        result = initialIndexes.map(idx => genericChoices[idx].name);
      }
    } else {
      // enquirer does not clear the stdout buffer on TSTP (Ctrl + Z) so this listener maps it to process.exit() which will clear the buffer
      // This does mean that the process can't be resumed, but enquirer errors when trying to resume the process anyway because it can't reattach to the TTY buffer
      const sigTstpListener = () => process.exit();
      process.once('SIGTSTP', sigTstpListener);
      ({ result } = await this.prompter<{ result: RS extends 'many' ? string[] : string }>({
        // actions is not part of the TS interface but it's part of the JS API
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        actions,
        // footer is not part of the TS interface but it's part of the JS API
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        footer: opts?.returnSize === 'many' ? chalk.gray('(Use <space> to select, <ctrl + a> to toggle all)') : undefined,
        type: 'autocomplete',
        name: 'result',
        message,
        hint: '(Use arrow keys or type to filter)',
        initial: initialIndexes,
        // there is a typo in the .d.ts file for this field -- muliple -> multiple
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        multiple: opts?.returnSize === 'many',
        choices: enquirerChoices,
        pointer(_: unknown, i: number) {
          // this.state is bound to a property of enquirer's prompt object, it does not reference a property of AmplifyPrompter
          return this.state.index === i ? chalk.cyan('❯') : ' ';
        },
        validate() {
          if (opts && ('pickAtLeast' in opts || 'pickAtMost' in opts)) {
            // this.selected is bound to a property of enquirer's prompt object, it does not reference a property of AmplifyPrompter
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (this.selected.length < (opts.pickAtLeast ?? 0)) {
              return `Select at least ${opts.pickAtLeast} items`;
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (this.selected.length > (opts.pickAtMost ?? Number.POSITIVE_INFINITY)) {
              return `Select at most ${opts.pickAtMost} items`;
            }
          }
          return true;
        },
      }));
      // remove the TSTP listener
      process.removeListener('SIGTSTP', sigTstpListener);
    }

    if (Array.isArray(result)) {
      return result.map(item => choiceValueMap.get(item) as T) as PromptReturn<RS, T>;
    } else {
      // result is a string
      return choiceValueMap.get(result as string) as PromptReturn<RS, T>;
    }
  };
}

export const prompter: Prompter = new AmplifyPrompter();

/**
 * Helper function to generate a function that will return the indices of a selection set from a list
 * @param selection The list of values to select from a list
 * @param equals An optional function to determine if two elements are equal. If not specified, === is used
 * Note that choices are assumed to be unique by the equals function definition
 */
export const byValues =
  <T>(selection: T[], equals: EqualsFunction<T> = defaultEquals): MultiFilterFunction<T> =>
  (choices: T[]) =>
    selection.map(sel => choices.findIndex(choice => equals(choice, sel))).filter(idx => idx >= 0);

/**
 * Helper function to generate a function that will return an index of a single selection from a list
 * @param selection The single selection to find in the list
 * @param equals An optional function to determine if two elements are equal. If not specified, === is used
 * Note that choices are assumed to be unique by the equals function definition
 */
export const byValue =
  <T>(selection: T, equals: EqualsFunction<T> = defaultEquals): SingleFilterFunction<T> =>
  (choices: T[]) => {
    const idx = choices.findIndex(choice => equals(choice, selection));
    return idx < 0 ? undefined : idx;
  };

const validateEachWith = (validator?: Validator) => async (input: string[]) => {
  if (!validator) {
    return true;
  }
  const validationList = await Promise.all(input.map(part => part.trim()).map(async part => ({ part, result: await validator(part) })));
  const firstInvalid = validationList.find(v => typeof v.result === 'string');
  if (firstInvalid) {
    return `${firstInvalid.part} did not satisfy requirement ${firstInvalid.result}`;
  }
  return true;
};

const initialOptsToIndexes = <RS extends ReturnSize, T>(
  values: T[],
  initial: InitialSelectionOption<RS, T>['initial'],
): number | number[] | undefined => {
  if (initial === undefined || typeof initial === 'number' || Array.isArray(initial)) {
    return initial;
  }
  return initial(values);
};

type EqualsFunction<T> = (a: T, b: T) => boolean;

const defaultEquals = <T>(a: T, b: T) => a === b;

type Prompter = {
  confirmContinue: (message?: string) => Promise<boolean>;
  yesOrNo: (message: string, initial?: boolean) => Promise<boolean>;
  // options is typed using spread because it's the only way to make it optional if RS is 'one' and T is a string but required otherwise
  input: <RS extends ReturnSize = 'one', T = string>(
    message: string,
    ...options: MaybeOptionalInputOptions<RS, T>
  ) => Promise<PromptReturn<RS, T>>;
  pick: <RS extends ReturnSize = 'one', T = string>(
    message: string,
    choices: Choices<T>,
    // options is typed using spread because it's the only way to make it required if RS is 'many' but optional if RS is 'one'
    ...options: MaybeOptionalPickOptions<RS, T>
  ) => Promise<PromptReturn<RS, T>>;
};

// the following types are the building blocks of the method input types

// Hidden cannot be specified if ReturnSize is 'many'
type MaybeAvailableHiddenInputOption<RS extends ReturnSize> = RS extends 'many'
  ? {}
  : {
      hidden?: boolean;
    };

// The initial selection for a pick prompt can be specified either by index or a selection function that generates indexes.
// See byValues and byValue above
type InitialSelectionOption<RS extends ReturnSize, T> = {
  initial?: RS extends 'one' ? number | SingleFilterFunction<T> : number[] | MultiFilterFunction<T>;
};

type SingleFilterFunction<T> = (arr: T[]) => number | undefined;

type MultiFilterFunction<T> = (arr: T[]) => number[];

type InitialValueOption<T> = {
  initial?: T;
};

type MultiSelectMinimun<RS extends ReturnSize> = RS extends 'one'
  ? {}
  : {
      pickAtLeast?: number;
    };

type MultiSelectMaximum<RS extends ReturnSize> = RS extends 'one'
  ? {}
  : {
      pickAtMost?: number;
    };

type ValidateValueOption = {
  validate?: Validator;
};

type ValidatorCast = (input: string | string[]) => string | true | Promise<string> | Promise<true>;

type TransformOption<T> = {
  transform: (value: string) => T | Promise<T>;
};

type MaybeOptionalTransformOption<T> = T extends string ? Partial<TransformOption<T>> : TransformOption<T>;

type ReturnSizeOption<RS extends ReturnSize> = RS extends 'many'
  ? {
      returnSize: 'many';
    }
  : {
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

type MaybeOptionalInputOptions<RS extends ReturnSize, T> = RS extends 'many'
  ? [InputOptions<RS, T>]
  : T extends string
  ? [InputOptions<RS, T>?]
  : [InputOptions<RS, T>];

type MaybeOptionalPickOptions<RS extends ReturnSize, T> = RS extends 'many' ? [PickOptions<RS, T>] : [PickOptions<RS, T>?];

type PromptReturn<RS extends ReturnSize, T> = RS extends 'many' ? T[] : T;

// the following types are the method input types
type PickOptions<RS extends ReturnSize, T> = ReturnSizeOption<RS> &
  InitialSelectionOption<RS, T> &
  MultiSelectMaximum<RS> &
  MultiSelectMinimun<RS>;

type InputOptions<RS extends ReturnSize, T> = ReturnSizeOption<RS> &
  ValidateValueOption &
  InitialValueOption<T> &
  MaybeOptionalTransformOption<T> &
  MaybeAvailableHiddenInputOption<RS>;
