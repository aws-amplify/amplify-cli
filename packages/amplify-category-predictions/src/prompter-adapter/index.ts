import { prompter } from 'amplify-prompts';

/**
 * This class is a wrapper around the amplify-prompts package that allows to pass a
 * question object and decide the proper way to prompt the user based on the question type.
 *
 * To be integrated in AmplifyPrompter if is to be used in other packages
 */
class PrompterAdapter {
  async prompt(input: any) {
    switch (input.type) {
      case 'continue':
        return prompter.confirmContinue(input.message);
      case 'confirm':
        return prompter.yesOrNo(input.message, input.initial ?? true);
      case 'input':
        return prompter.input(input.message, input.options);
      case 'list':
        return prompter.pick(input.message, input.choices, input.options);
      default:
        throw new Error(`Invalid question type: ${input.type}`);
    }
  }
}

export const prompterAdapter = new PrompterAdapter();

export enum PrompterInput {
  CONFIRM_CONTINUE = 'continue',
  CONFIRM = 'confirm',
  INPUT = 'input',
  LIST = 'list',
}
