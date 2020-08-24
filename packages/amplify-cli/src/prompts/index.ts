export * from './default-editor';
export * from './env-name';
export * from './frontend-handler';
export * from './project-name';
export * from './providers';

type validatorFunction = (input: string) => boolean;

export class InputPrompt {
  name: string | (() => string);
  type: string | (() => string);
  message: string | (() => string);
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
  name: string | (() => string);
  type: string | (() => string);
  message: string | (() => string);
  choices: string[];
  initial?: string;
  validate?: (input: string) => string | true;
  constructor(promptName, promptMessage, choicesSelect, initialSelect?) {
    this.type = 'select';
    (this.name = promptName), (this.message = promptMessage), (this.choices = choicesSelect), (this.initial = initialSelect);
  }
}
