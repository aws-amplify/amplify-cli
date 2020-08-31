import { prompt } from 'enquirer';

export type validatorFunction = (input: string) => boolean;

export interface Choice {
  name: string;
  message?: string;
  value?: string;
  hint?: string;
  disabled?: boolean | string;
}

export async function executePrompt(promptQuestion: InputPrompt | SelectPrompt) {
  const answer: any = await prompt(promptQuestion);
  // logging possible here
  return answer[promptQuestion.name];
}

export class InputPrompt {
  name: string;
  type: string;
  message: string;
  initial?: string;
  validate?: (input: string) => string | true;
  constructor(promptName: string, promptMessage: string, initialInput: string, validator: validatorFunction, invalidMessage: string) {
    this.type = 'input';
    (this.name = promptName),
      (this.message = promptMessage),
      (this.initial = initialInput),
      (this.validate = input => validator(input) || invalidMessage);
  }
}

export class SelectPrompt {
  name: string;
  type = 'select';
  message: string;
  choices: string[] | Choice[];
  initial?: string;

  constructor(promptName: string, promptMessage: string, choicesSelect: string[] | Choice[], initialSelect?: string) {
    (this.name = promptName), (this.message = promptMessage), (this.choices = choicesSelect), (this.initial = initialSelect);
  }
}

export class MultiSelectPrompt extends SelectPrompt {
  type = 'multiselect';
}
