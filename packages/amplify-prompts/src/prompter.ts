/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-len */
/* eslint-disable no-return-assign */
/* eslint-disable no-nested-ternary */
import { prompt } from 'enquirer';
// enquirer actions are not part of the TS types, but they are the recommended way to override enquirer behavior
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as actions from 'enquirer/lib/combos';
import chalk from 'chalk';
import { IFlowData } from 'amplify-cli-shared-interfaces';
import { isYes, isInteractiveShell } from './flags';
import { Validator } from './validators';
import { printer } from './printer';
import { Stopwatch } from './stopwatch';

/**
 * Provides methods for collecting interactive customer responses from the shell
 */
class AmplifyPrompter implements Prompter {
  flowData: IFlowData | undefined; // interactive cli flow data journal
  stopWatch: Stopwatch;
  constructor(private readonly prompter: typeof prompt = prompt, private readonly print: typeof printer = printer) {
    // construct a shim on top of enquirer to throw an error if it is called when stdin is non-interactive
    // enquirer does not export its PromptOptions type and this package does not depend on amplify-cli-core so using 'any' as the input type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prompterShim = ((opts: any) => {
      if (isInteractiveShell) {
        return prompter(opts);
      }
      throw new Error(`Cannot prompt for [${opts.message}] in a non-interactive shell`);
    }) as typeof prompt;
    this.prompter = prompterShim;
    this.stopWatch = new Stopwatch();
  }

  private throwLoggedError = (message: string, errorMsg: string): void => {
    this.flowData?.pushInteractiveFlow(message, errorMsg);
    throw new Error(errorMsg);
  };

  setFlowData = (flowData: IFlowData): void => {
    this.flowData = flowData;
  };

  private pushInteractiveFlow = (promptString: string, input: unknown, redact = false) => {
    if (isInteractiveShell) {
      if (this.flowData && input) {
        const finalInput = redact ? '*'.repeat((input as string).length) : input;
        this.flowData.pushInteractiveFlow(promptString, finalInput);
      }
    }
  };

  /**
   * Asks a continue prompt.
   * Similar to yesOrNo, but 'false' is always the default and if the --yes flag is set, the prompt is skipped and 'true' is returned
   */
  confirmContinue = async (message = 'Do you want to continue?'): Promise<boolean> => {
    let result = false;
    if (isYes) {
      result = true;
    } else {
      result = await this.yesOrNoCommon(message, false);
    }
    return result;
  };

  /**
   * Asks a yes or no question.
   * If the --yes flag is set, the prompt is skipped and the initial value is returned
   */
  yesOrNo = async (message: string, initial = true): Promise<boolean> => {
    let result = false;
    if (isYes) {
      result = initial;
    } else {
      result = await this.yesOrNoCommon(message, initial);
    }
    return result;
  };

  private yesOrNoCommon = async (message: string, initial: boolean): Promise<boolean> => {
    let submitted = false;
    this.stopWatch.start();
    const { result } = await this.prompter<{ result: boolean }>({
      type: 'confirm',
      name: 'result',
      message,
      // eslint-disable-next-line no-nested-ternary
      format: value => (submitted ? (value ? 'yes' : 'no') : ''),
      onSubmit: () => {
        submitted = true;
        return true;
      },
      initial,
    });
    this.stopWatch.pause();
    this.pushInteractiveFlow(message, result);
    return result;
  };

  /**
   * Prompt for an input.
   * By default the input is a string, but can be any type.
   * If the type is not a string, the transform function is required to map the prompt response (which is always a string)
   * to the expected return type
   *
   * If a ReturnSize of 'many' is specified, then the input is treated as a comma-delimited list and returned as an array.
   * The validate and transform functions will be applied to each element in the list individually
   *
   * If the yes flag is set, the initial value is returned. If no initial value is specified, an error is thrown
   * @param message The prompt message
   * @param options Prompt options. options.transform is required if T !== string
   * @returns The prompt response
   */
  input = async <RS extends ReturnSize = 'one', T = string>(
    message: string,
    ...options: MaybeOptionalInputOptions<RS, T>
  ): Promise<PromptReturn<RS, T>> => {
    const opts = options?.[0] ?? ({} as InputOptions<RS, T>);
    const enquirerPromptType: EnquirerPromptType =
      'hidden' in opts && opts.hidden
        ? EnquirerPromptType.INVISIBLE
        : opts.returnSize === 'many'
        ? EnquirerPromptType.LIST
        : EnquirerPromptType.INPUT;

    if (isYes) {
      if (opts.initial !== undefined) {
        this.pushInteractiveFlow(message, opts.initial, enquirerPromptType === EnquirerPromptType.INVISIBLE);
        return opts.initial as PromptReturn<RS, T>;
      }
      this.throwLoggedError(message, `Cannot prompt for [${message}] when '--yes' flag is set`);
    }

    const validator = (opts.returnSize === 'many' ? validateEachWith(opts.validate) : opts.validate) as ValidatorCast;
    this.stopWatch.start();
    const { result } = await this.prompter<{ result: RS extends 'many' ? string[] : string }>({
      // eslint-disable-next-line no-nested-ternary
      type: enquirerPromptType,
      name: 'result',
      message,
      validate: validator,
      initial: opts.initial,
      // footer is not part of the TS interface but it's part of the JS API
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      footer: opts.returnSize === 'many' ? 'Enter a comma-delimited list of values' : undefined,
    });
    this.stopWatch.pause();

    if (typeof opts.transform === 'function') {
      let functionResult;
      if (Array.isArray(result)) {
        functionResult = ((await Promise.all(
          result.map(async part => (opts.transform as Function)(part) as T),
        )) as unknown) as PromptReturn<RS, T>;
      } else {
        functionResult = (opts.transform(result as string) as unknown) as PromptReturn<RS, T>;
      }
      this.pushInteractiveFlow(message, functionResult, enquirerPromptType == EnquirerPromptType.INVISIBLE);
      return functionResult;
    }

    this.pushInteractiveFlow(message, result, enquirerPromptType == EnquirerPromptType.INVISIBLE);
    return (result as unknown) as PromptReturn<RS, T>;
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
    if (!choices?.length) {
      this.throwLoggedError(message, `No choices provided for prompt [${message}]`);
    }

    const opts = options?.[0] || {};

    // map string[] choices into GenericChoice<T>[]
    const genericChoices: GenericChoice<T>[] =
      typeof choices[0] === 'string'
        ? // this assertion is safe because the choice array can only be a string[] if the generic type is a string
          (((choices as string[]).map(choice => ({ name: choice, value: choice })) as unknown) as GenericChoice<T>[])
        : (choices as GenericChoice<T>[]);

    const initialIndexes = initialOptsToIndexes(
      genericChoices.map(choice => choice.value),
      opts.initial,
    );

    // enquirer requires all choice values be strings, so set up a mapping of string => T
    // and format choices to conform to enquirer's interface
    const choiceValueMap = new Map<string, T>();
    const enquirerChoices = genericChoices.map(choice => {
      choiceValueMap.set(choice.name, choice.value);
      const enqResult = { name: choice.name, disabled: choice.disabled, hint: choice.hint };
      return enqResult;
    });

    actions.ctrl.a = 'a';

    let result = genericChoices[0].name as string | string[];
    this.stopWatch.start();
    if (choices.length === 1 && opts.returnSize !== 'many') {
      this.print.info(`Only one option for [${message}]. Selecting [${result}].`);
    } else if ('pickAtLeast' in opts && (opts.pickAtLeast || 0) >= choices.length) {
      // if you have to pick at least as many options as are available, select all of them and return without prompting
      result = genericChoices.map(choice => choice.name);
      this.print.info(`Must pick at least ${opts.pickAtLeast} of ${choices.length} options. Selecting all options [${result}]`);
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
      // This does mean that the process can't be resumed, but enquirer errors when trying to resume the process anyway because it can't
      // reattach to the TTY buffer
      // eslint-disable-next-line spellcheck/spell-checker
      const sigTstpListener = (): void => process.exit();
      // eslint-disable-next-line spellcheck/spell-checker
      process.once('SIGTSTP', sigTstpListener);
      ({ result } = await this.prompter<{ result: RS extends 'many' ? string[] : string }>({
        // actions is not part of the TS interface but it's part of the JS API
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        actions,
        // footer is not part of the TS interface but it's part of the JS API
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        footer: opts.returnSize === 'many' ? chalk.gray('(Use <space> to select, <ctrl + a> to toggle all)') : undefined,
        type: 'autocomplete',
        name: 'result',
        message,
        hint: '(Use arrow keys or type to filter)',
        initial: initialIndexes,
        // eslint-disable-next-line spellcheck/spell-checker
        // there is a typo in the .d.ts file for this field -- muliple -> multiple
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        multiple: opts.returnSize === 'many',
        choices: enquirerChoices,
        pointer(_: unknown, i: number) {
          // this.state is bound to a property of enquirer's prompt object, it does not reference a property of AmplifyPrompter
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return this.state.index === i ? chalk.cyan('❯') : ' ';
        },
        indicator(_: unknown, choice: { enabled: boolean }) {
          return choice.enabled ? chalk.cyan('●') : '○';
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
      // eslint-disable-next-line spellcheck/spell-checker
      process.removeListener('SIGTSTP', sigTstpListener);
    }

    let loggedRet;
    if (Array.isArray(result)) {
      // result is an array
      loggedRet = result.map(item => choiceValueMap.get(item) as T) as PromptReturn<RS, T>;
    } else {
      // result is a string
      loggedRet = choiceValueMap.get(result as string) as PromptReturn<RS, T>;
    }
    this.stopWatch.pause();
    this.pushInteractiveFlow(message, loggedRet);
    return loggedRet;
  };

  getTotalPromptElapsedTime = (): number => this.stopWatch.getElapsedMilliseconds();
}

export const prompter: Prompter = new AmplifyPrompter();

/**
 * Helper function to generate a function that will return the indices of a selection set from a list
 * @param selection The list of values to select from a list
 * @param equals An optional function to determine if two elements are equal. If not specified, === is used
 * Note that choices are assumed to be unique by the equals function definition
 */
export const byValues = <T>(selection: T[], equals: EqualsFunction<T> = defaultEquals): MultiFilterFunction<T> => (choices: T[]) =>
  selection.map(sel => choices.findIndex(choice => equals(choice, sel))).filter(idx => idx >= 0);

/**
 * Helper function to generate a function that will return an index of a single selection from a list
 * @param selection The single selection to find in the list
 * @param equals An optional function to determine if two elements are equal. If not specified, === is used
 * Note that choices are assumed to be unique by the equals function definition
 */
export const byValue = <T>(selection: T, equals: EqualsFunction<T> = defaultEquals): SingleFilterFunction<T> => (choices: T[]) => {
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

const defaultEquals = <T>(a: T, b: T): boolean => a === b;

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
  setFlowData: (flowData: IFlowData) => void;
  getTotalPromptElapsedTime: () => number;
};

// the following types are the building blocks of the method input types

// Hidden cannot be specified if ReturnSize is 'many'
type MaybeAvailableHiddenInputOption<RS extends ReturnSize> = RS extends 'many'
  ? unknown
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

type MultiSelectMinimum<RS extends ReturnSize> = RS extends 'one'
  ? unknown
  : {
      pickAtLeast?: number;
    };

type MultiSelectMaximum<RS extends ReturnSize> = RS extends 'one'
  ? unknown
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
  MultiSelectMinimum<RS>;

type InputOptions<RS extends ReturnSize, T> = ReturnSizeOption<RS> &
  ValidateValueOption &
  InitialValueOption<T> &
  MaybeOptionalTransformOption<T> &
  MaybeAvailableHiddenInputOption<RS>;

// abstraction over equirer prompt types
enum EnquirerPromptType {
  INVISIBLE = 'invisible',
  LIST = 'list',
  INPUT = 'input',
}
