import { prompt } from 'enquirer';

export type validatorFunction = (input: string) => boolean;

export interface Choice {
  name: string;
  message?: string;
  value?: string;
  hint?: string;
  disabled?: boolean | string;
}

class BasePrompt {
  type = 'base';
  constructor(public name: string, public message: string, public initial?: string) {}
  public async run(logging: boolean = false) {
    const answer: any = await prompt(this);
    // logging possible here
    return answer[this.name];
  }
}

export class InputPrompt extends BasePrompt {
  type = 'input';
  validate?: (input: string) => string | true;
  constructor(name: string, message: string, initial: string, validator: validatorFunction, invalidMessage: string) {
    super(name, message, initial);
    this.validate = input => validator(input) || invalidMessage;
  }
}

export class PasswordPrompt extends InputPrompt {
  type = 'password';
}

export class SelectPrompt extends BasePrompt {
  type = 'select';
  constructor(name: string, message: string, public choices: string[] | Choice[], initial?: string) {
    super(name, message, initial);
  }
}

export class MultiSelectPrompt extends SelectPrompt {
  type = 'multiselect';
}
