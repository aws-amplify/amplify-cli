import { prompt } from 'enquirer';
// enquirer actions are not part of the TS types, but they are the recommended way to override enquirer behavior
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as actions from 'enquirer/lib/combos';
import { isYes } from './flags';
import { Validator } from './validators';
import { printer } from './printer';
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
   * @param message The prompt message
   * @param options Prompt options. options.transform is required if T !== string
   * @returns The prompt response
   */
  input = async <T = string>(message: string, ...options: T extends string ? [InputOptions<T>?] : [InputOptions<T>]) => {
    if (isYes) {
      throw new Error(`Cannot prompt for [${message}] when '--yes' flag is set`);
    }
    const opts = options?.[0];
    const { result } = await this.prompter<{ result: string }>({
      type: opts?.hidden ? 'invisible' : 'input',
      name: 'result',
      message,
      validate: opts?.validate as ValidatorCast,
      initial: opts?.initial,
    });
    return typeof opts?.transform === 'function' ? ((await opts.transform(result)) as T) : ((result as unknown) as T); // this type assertion is safe because transform must be defined unless T is string
  };

  /**
   * Pick item(s) from a selection set.
   * @param message The prompt message
   * @param choices The selection set to choose from
   * @param options Control prompt settings. options.multiselect = true is required if PickType = 'many'
   * @returns The item(s) selected. If PickType = 'one' this is a single value. If PickType = 'many', this is an array
   */
  pick = async <M extends PickType, T = string>(
    message: string,
    choices: Choices<T>,
    ...options: M extends 'one' ? [PickOptions<M>?] : [PickOptions<M>]
  ): Promise<PickReturn<M, T>> => {
    if (isYes) {
      throw new Error(`Cannot prompt for [${message}] when '--yes' flag is set`);
    }
    // some choices must be provided
    if (choices?.length === 0) {
      throw new Error(`No choices provided for prompt [${message}]`);
    }

    const opts = options?.[0];

    // map string[] choices into GenericChoice<T>[]
    const genericChoices: GenericChoice<T>[] =
      typeof choices[0] === 'string'
        ? (((choices as string[]).map(choice => ({ name: choice, value: choice })) as unknown) as GenericChoice<T>[]) // this assertion is safe because the choice array can only be a string[] if the generic type is a string
        : (choices as GenericChoice<T>[]);

    // enquirer requires all choice values be strings, so set up a mapping of string => T
    // and format choices to conform to enquirer's interface
    const choiceValueMap = new Map<string, T>();
    const enquirerChoices = genericChoices.map((choice, idx) => {
      choiceValueMap.set(choice.name, choice.value);
      return { name: choice.name, disabled: choice.disabled, hint: choice.hint };
    });

    actions.ctrl.a = 'a';

    let result = typeof choices[0] === 'string' ? choices[0] : ((choices[0] as GenericChoice<T>).name as string | string[]);

    if (choices?.length === 1) {
      this.print.info(`Only one option for ${message}. Selecting ${result} by default.`);
    } else {
      ({ result } = await this.prompter<{ result: M extends 'many' ? string[] : string }>({
        // actions is not part of the TS interface but it's part of the JS API
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        actions,
        // footer is not part of the TS interface but it's part of the JS API
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        footer: opts?.multiselect ? '(Use <space> to select, <ctrl + a> to toggle all)' : undefined,
        type: 'autocomplete',
        name: 'result',
        message,
        initial: opts?.initial,
        // there is a typo in the .d.ts file for this field -- muliple -> multiple
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        multiple: opts?.multiselect,
        choices: enquirerChoices,
      }));
    }

    if (Array.isArray(result)) {
      return result.map(item => choiceValueMap.get(item) as T) as PickReturn<M, T>;
    } else {
      // result is a string
      return choiceValueMap.get(result as string) as PickReturn<M, T>;
    }
  };
}

export const prompter: Prompter = new AmplifyPrompter();

type Prompter = {
  confirmContinue: (message?: string) => Promise<boolean>;
  yesOrNo: (message: string, initial?: boolean) => Promise<boolean>;
  input: <T = string>(message: string, ...options: T extends string ? [InputOptions<T>?] : [InputOptions<T>]) => Promise<T>;
  pick: <M extends PickType, T = string>(
    message: string,
    choices: Choices<T>,
    ...options: M extends 'one' ? [PickOptions<M>?] : [PickOptions<M>]
  ) => Promise<PickReturn<M, T>>;
};

// the following types are the building blocks of the method input types

type HiddenInputOption = {
  hidden?: boolean;
};

type InitialSelectionOption<M extends PickType> = {
  initial?: M extends 'one' ? number : number[];
};

type InitialValueOption<T> = {
  initial?: T;
};

type ValidateValueOption = {
  validate?: Validator;
};

type ValidatorCast = (input: string) => string | true | Promise<string> | Promise<true>;

type TransformOption<T> = {
  transform: (value: string) => T | Promise<T>;
};

type MaybeTransformOption<T> = T extends string ? Partial<TransformOption<T>> : TransformOption<T>;

type MultiselectOption<M extends PickType> = M extends 'many'
  ? {
      multiselect: true;
    }
  : {
      multiselect?: false;
    };

type Choices<T> = T extends string ? GenericChoice<T>[] | string[] : GenericChoice<T>[];

type GenericChoice<T> = {
  name: string;
  value: T;
  hint?: string;
  disabled?: boolean;
};

type PickType = 'many' | 'one';

type PickReturn<M extends PickType, T> = M extends 'many' ? T[] : T;

// the following types are the method input types
type PickOptions<M extends PickType> = MultiselectOption<M> & InitialSelectionOption<M>;

type InputOptions<T> = ValidateValueOption & InitialValueOption<T> & MaybeTransformOption<T> & HiddenInputOption;
