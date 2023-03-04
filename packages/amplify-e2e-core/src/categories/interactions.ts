import { nspawn as spawn, getCLIPath } from '..';

export const addSampleInteraction = async (cwd: string): Promise<void> => {
  return spawn(getCLIPath(), ['add', 'interactions'], { cwd, stripColors: true })
    .wait('Provide a friendly resource name that will be used to label this category')
    .sendCarriageReturn()
    .wait('Would you like to start with a sample chatbot')
    .sendCarriageReturn()
    .wait('Choose a sample chatbot:')
    .sendCarriageReturn()
    .wait("Please indicate if your use of this bot is subject to the Children's")
    .sendYes()
    .sendEof()
    .runAsync();
};
