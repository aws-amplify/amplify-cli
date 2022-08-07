import { FunctionTemplateParameters, TemplateContributionRequest } from 'amplify-function-plugin-interface';
import { templateRoot } from '../utils/constants';
import path from 'path';

const pathToTemplateFiles = path.join(templateRoot, 'lambda');

export async function provideAppSyncTodo(request: TemplateContributionRequest): Promise<FunctionTemplateParameters> {
  const files = [
    'appsync-todo/build.gradle.ejs',
    'appsync-todo/LambdaRequestHandler.java.ejs',
    'appsync-todo/RequestClass.java.ejs',
    'appsync-todo/ResponseClass.java.ejs',
    'appsync-todo/event.json',
  ];
  const handlerSource = path.join('src', 'main', 'java', 'example', 'LambdaRequestHandler.java');

  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: handlerSource,
      destMap: {
        'appsync-todo/build.gradle.ejs': path.join('build.gradle'),
        'appsync-todo/event.json': path.join('src', 'event.json'),
        'appsync-todo/LambdaRequestHandler.java.ejs': path.join('src', 'main', 'java', 'example', 'LambdaRequestHandler.java'),
        'appsync-todo/RequestClass.java.ejs': path.join('src', 'main', 'java', 'example', 'RequestClass.java'),
        'appsync-todo/ResponseClass.java.ejs': path.join('src', 'main', 'java', 'example', 'ResponseClass.java'),
      },
    },
  };
}
