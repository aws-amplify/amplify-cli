import { FunctionTemplateContributorFactory, FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import fs from 'fs-extra';

const pathToHelloWorld = `${__dirname}/../resources/hello-world`;
const pathToCrud = `${__dirname}/../resources/crud`;

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = context => {
  return {
    contribute: request => {
      const selection = request.selection;
      if (selection === 'hello-world') {
        return getTemplate(pathToHelloWorld);
      } else if (selection === 'crud') {
        return getTemplate(pathToCrud);
      }
      throw new Error(`Unknown python template selection ${selection}`);
    },
  };
};

export function getTemplate(filePath: string): Promise<FunctionTemplateParameters> {
  const files = fs.readdirSync(filePath);
  return Promise.resolve({
    functionTemplate: {
      sourceRoot: filePath,
      sourceFiles: files,
      destMap: {
        'index.py': 'src/index.py',
        'event.json': 'src/event.json',
        'setup.py': 'src/setup.py',
      },
      defaultEditorFile: 'src/index.py',
    },
  });
}
