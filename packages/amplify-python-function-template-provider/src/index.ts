import { FunctionTemplateContributorFactory, FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import fs from 'fs-extra';

const pathToHelloWorld = `${__dirname}/../resources/hello-world`;
const pathToCrud = `${__dirname}/../resources/crud`;

export const functionTemplateContributorFactory: FunctionTemplateContributorFactory = context => {
  return {
    contribute: request => {
      const selection = request.selection;
      if (selection === 'hello-world') {
        return helloWorld();
      } else if (selection === 'crud') {
        return crud();
      }
      throw new Error(`Unknown python template selection ${selection}`);
    },
  };
};

export function helloWorld(): Promise<FunctionTemplateParameters> {
  const files = fs.readdirSync(pathToHelloWorld);
  return Promise.resolve({
    functionTemplate: {
      sourceRoot: pathToHelloWorld,
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

export function crud(): Promise<FunctionTemplateParameters> {
  const files = fs.readdirSync(pathToCrud);
  return Promise.resolve({
    functionTemplate: {
      sourceRoot: pathToCrud,
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
