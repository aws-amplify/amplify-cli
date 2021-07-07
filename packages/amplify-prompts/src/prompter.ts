import { prompt } from 'enquirer';
import { isYes } from './flags';

class AmplifyPrompter implements Prompter {
  constructor(private readonly prompter: typeof prompt = prompt) {}

  /**
   * Asks a continue prompt.
   * Similar to yesOrNo, but "no" is always the default and if the --yes flag is set, the prompt is skipped and 'true' is returned
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
   * Convenience method to make it easy to get a string response from a prompt.
   * Same as genericInput<string>
   * @param message The prompt message
   * @param options Prompt options
   * @returns The prompt response
   */
  stringInput = async (message: string, options?: StringInputOptions) =>
    this.genericInput<string>(message, { ...options, transform: options?.transform ?? (input => input) });

  /**
   * Prompt for a data type besides a string.
   * In this case the transform option is required to map the prompt response (which is always a string) to the expected return type
   * @param message The prompt message
   * @param options Prompt options. options.transform is required
   * @returns The prompt response
   */
  genericInput = async <T>(message: string, options: GenericInputOptions<T>) => {
    const { result } = await this.prompter<{ result: string }>({
      type: options?.hidden ? 'invisible' : 'input',
      name: 'result',
      message,
      validate: options?.validate,
    });
    return await options.transform(result);
  };

  pickOne = async <T = string>(message: string, choices: Choice<T>[], options?: BaseOptions<T>) =>
    (await this.pickCommon('autocomplete', message, choices, options)) as T;

  pickMany = async <T = string>(message: string, choices: Choice<T>[], options?: BaseOptions<T>) =>
    (await this.pickCommon('multiselect', message, choices, options)) as T[];

  /**
   * Common list pick functionality. If type is 'autocomplete', a value of type T is returned. If type is multiselect a T[] is returned.
   */
  private pickCommon = async <T = string>(
    type: 'autocomplete' | 'multiselect',
    message: string,
    choices: Choice<T>[],
    options?: BaseOptions<T>,
  ): Promise<T | T[]> => {
    // some choices must be provided
    if (choices?.length === 0) {
      throw new Error(`No choices provided for prompt [${message}]`);
    }

    // map string[] choices into GenericChoice<T>[]
    const genericChoices: GenericChoice<T>[] =
      typeof choices[0] === 'string'
        ? (((choices as string[]).map(choice => ({ name: choice, value: choice })) as unknown) as GenericChoice<T>[]) // this assertion is safe because the choice array can only be a string[] if the generic type is a string
        : (choices as GenericChoice<T>[]);

    // enquirer requires all choice values be strings, so set up a mapping of string => T
    // and format choices to conform to enquirer's interface
    const choiceValueMap = new Map<string, T>();
    let initialIdx: number = 0;
    const enquirerChoices = genericChoices.map((choice, idx) => {
      choiceValueMap.set(choice.name, choice.value);
      if (choice.value === options?.initial) {
        initialIdx = idx;
      }
      return { name: choice.name, disabled: choice.disabled, hint: choice.hint };
    });

    const { result } = await this.prompter<{ result: T extends 'autocomplete' ? string : string[] }>({
      type,
      name: 'result',
      message,
      initial: initialIdx,
      choices: enquirerChoices,
      validate: options?.validate,
    });

    if (Array.isArray(result)) {
      return result.map(item => choiceValueMap.get(item) as T);
    } else {
      // result is a string
      return choiceValueMap.get(result) as T;
    }
  };
}

export const prompter: Prompter = new AmplifyPrompter();

type Prompter = {
  confirmContinue: (message?: string) => Promise<boolean>;
  yesOrNo: (message: string) => Promise<boolean>;
  stringInput: (message: string, options?: StringInputOptions) => Promise<string>;
  genericInput: <T>(message: string, options: GenericInputOptions<T>) => Promise<T>;
  pickOne: <T = string>(message: string, choices: Choice<T>[], options?: BaseOptions<T>) => Promise<T>;
  pickMany: <T = string>(message: string, choices: Choice<T>[], options?: BaseOptions<T>) => Promise<T[]>;
};

type StringInputOptions = BaseOptions & Partial<TransformOption> & InputOptions;

type GenericInputOptions<T> = BaseOptions<T> & TransformOption<T> & InputOptions;

type InputOptions = {
  hidden?: boolean;
};

type BaseOptions<T = string> = {
  initial?: T;
  validate?: (value: string) => boolean | Promise<boolean> | string | Promise<string>;
};

type TransformOption<T = string> = {
  transform: (value: string) => T | Promise<T>;
};

type Choice<T = string> = T extends string ? GenericChoice<T> | string : GenericChoice<T>;

type GenericChoice<T> = {
  name: string;
  value: T;
  hint?: string;
  disabled?: boolean;
};
