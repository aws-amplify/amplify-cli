import { prompt } from 'enquirer';

type validatorFunction = (input: string) => boolean;

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
  type: string;
  message: string;
  choices: string[];
  initial?: string;
  constructor(promptName: string, promptMessage: string, choicesSelect: string[], initialSelect?: string) {
    this.type = 'select';
    (this.name = promptName), (this.message = promptMessage), (this.choices = choicesSelect), (this.initial = initialSelect);
  }
}
