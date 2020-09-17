import { FunctionTemplateContributorFactory, FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import fs from 'fs-extra';

const pathToTemplateFiles = `${__dirname}/../resources/hello-world`;

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = context => {
  return {
    contribute: request => {
      const selection = request.selection;
      if (selection !== 'hello-world') {
        throw new Error(`Unknown python template selection ${selection}`);
      }
      return helloWorld();
    },
  };
};

export function helloWorld(): Promise<FunctionTemplateParameters> {
  const files = fs.readdirSync(pathToTemplateFiles);
  return Promise.resolve({
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      destMap: {
        'index.py': 'src/index.py',
        'event.json': 'src/event.json',
      },
      defaultEditorFile: 'src/index.py',
    },
  });
}
