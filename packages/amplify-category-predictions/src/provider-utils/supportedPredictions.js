/* eslint-disable no-multi-str */
import chalk from 'chalk';
import { printer, prompter } from 'amplify-prompts';

const categoryChoices = [
  {
    name: 'Identify',
    value: { provider: 'awscloudformation', fileName: 'identify-walkthrough.js' },
  },
  {
    name: 'Convert',
    value: { provider: 'awscloudformation', fileName: 'convert-walkthrough.js' },
  },
  {
    name: 'Interpret',
    value: { provider: 'awscloudformation', fileName: 'interpret-walkthrough.js' },
  },
  {
    name: 'Infer',
    value: { provider: 'awscloudformation', fileName: 'infer-walkthrough.js' },
  },
  {
    name: 'Learn More',
    value: 'learnMore',
  },
]

const consoleCategoryChoices = [
  {
    name: 'Infer',
    value: {
      category: 'Infer',
      provider: 'awscloudformation',
      services: ['SageMaker'],
      type: 'inferType',
      types: ['inferModel'],
    },
  },
  {
    name: 'Identify',
    value: {
      category: 'Identify',
      provider: 'awscloudformation',
      services: ['Rekognition'],
      type: 'identifyType',
      types: ['identifyEntities'],
    },
  },
];

export async function promptCategory() {
  const message = 'Please select from one of the categories below';
  const answers = await prompter.pick(message, categoryChoices);
  while (answers.predictionsCategory === 'learnMore') {
    let helpText =
      'Identify allows you to identify text (words, tables, pages from a book), entities (faces and/or celebrities) from images. You can also identify real world objects such as chairs, desks, etc. which are referred to as “labels” from images.\n\
  Convert allows you to translate text from one source language to a target language, using Amazon Translate. You can also generate speech audio from text input, using Amazon Polly. Lastly, you can take an audio input and transcribe it, using Amazon Transcribe.\n\
  Interpret allows you to analyze text for language, entities (places, people), key phrases, sentiment (positive, neutral, negative), and syntax (pronouns, verbs, adjectives).\n\
  Infer allows you to perform inference against a cloud endpoint. It’s an advanced feature using Amazon SageMaker, where you have more control over your models.\n\
  Learn More: https://docs.amplify.aws/lib/predictions/intro/q/platform/js';
    helpText = `\n${helpText.replace(new RegExp('[\\n]', 'g'), '\n\n')}\n\n`;
    printer.info(chalk.green(helpText));

    Object.assign(answers, await prompter.pick(message, categoryChoices));
  }
  return answers;
}

export const promptConsoleSupportedCategory = async () => {
  return await prompter.pick('Please select from one of the categories below', consoleCategoryChoices);
}

export default {};
