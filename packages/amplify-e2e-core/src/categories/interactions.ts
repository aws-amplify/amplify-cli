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
    .wait('Successfully added resource')
    .runAsync();
};

export const addInteractionsWithBotFromScratch = async (
  cwd: string,
  settings: { intentName: string; slotName: string; slotType: string; slotDescription: string; slotValue: string },
): Promise<void> => {
  const chain = spawn(getCLIPath(), ['add', 'interactions'], { cwd, stripColors: true });
  return chain
    .wait('Provide a friendly resource name that will be used to label this category in the project')
    .sendCarriageReturn()
    .wait('Would you like to start with a sample chatbot or start from scratch')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Enter a name for your bot')
    .sendCarriageReturn()
    .wait('Choose an output voice')
    .sendCarriageReturn()
    .wait('After how long should the session timeout (in minutes)')
    .sendCarriageReturn()
    .wait('Please indicate if your use of this bot is subject to the Children')
    .sendYes()
    .wait('Give a unique name for the new intent')
    .sendLine(settings.intentName)
    .wait('Enter a sample utterance (spoken or typed phrase that invokes your intent. e.g. Book a hotel)')
    .sendCarriageReturn()
    .wait('Would you like to add another utterance')
    .sendNo()
    .wait('Enter a name for your slot (e.g. Location)')
    .sendLine(settings.slotName)
    .wait(`Would you like to choose an Amazon built-in slot type, a slot type you've already made, or create a new slot type?`)
    .sendKeyDown(2)
    .sendCarriageReturn()
    .wait('What would you like to name your slot type?')
    .sendLine(settings.slotType)
    .wait('Give a description of your slot type')
    .sendLine(settings.slotDescription)
    .wait('Add a possible value for your slot')
    .sendLine(settings.slotValue)
    .wait('Add another slot value')
    .sendNo()
    .wait('Enter a prompt for your slot (e.g. What city?)')
    .sendCarriageReturn()
    .wait('Should this slot be required?')
    .sendYes()
    .wait('Would you like to add another slot?')
    .sendNo()
    .wait('Would you like to add a confirmation prompt to your intent?')
    .sendNo()
    .wait('How would you like the intent to be fulfilled?')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Would you like to create another intent?')
    .sendNo()
    .wait('Successfully added resource')
    .runAsync();
};

export const updateInteractions = async (cwd: string, settings: { slotName: string }): Promise<void> => {
  const chain = spawn(getCLIPath(), ['update', 'interactions'], { cwd, stripColors: true });
  return chain
    .wait('Would you like to add an intent or choose and existing intent?')
    .sendCarriageReturn()
    .wait('Would you like to add an utterance')
    .sendYes()
    .wait('Enter a sample utterance (spoken or typed phrase that invokes your intent. e.g. Book a hotel)')
    .sendCarriageReturn()
    .wait('Would you like to add another utterance')
    .sendNo()
    .wait('Would you like to add a slot')
    .sendYes()
    .wait('Enter a name for your slot (e.g. Location)')
    .sendLine(settings.slotName)
    .wait(`Would you like to choose an Amazon built-in slot type, a slot type you've already made, or create a new slot type?`)
    .sendCarriageReturn()
    .wait('Choose a slot type')
    .sendCarriageReturn()
    .wait('Enter a prompt for your slot (e.g. What city?)')
    .sendCarriageReturn()
    .wait('Should this slot be required?')
    .sendYes()
    .wait('Would you like to add another slot?')
    .sendNo()
    .wait('Successfully updated resource')
    .runAsync();
};
