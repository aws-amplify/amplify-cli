import { prompt } from 'enquirer';
import { InputPrompt, SelectPrompt } from '../prompts';

const INIT_FORM_MESSAGE = 'Enter the following information about your project';

export async function initFormPrompt(questionsList: (InputPrompt | SelectPrompt)[]) {
  const initFormQuestion = {
    type: 'form',
    name: 'initFormQuestions',
    message: INIT_FORM_MESSAGE,
    choices: questionsList,
  };
  const answers = await prompt(initFormQuestion);
  return answers;
}
