import { FunctionTemplateParameters, TemplateContributionRequest } from 'amplify-function-plugin-interface';
import { templateRoot } from '../utils/constants';
import path from 'path';
import { lambdaAPIAuthSelection } from '../utils/lambdaAPIAuthSelection';


const pathToTemplateFiles = path.join(templateRoot, 'lambda');

export async function provideAppSyncTodo(): Promise<FunctionTemplateParameters> {
  
  const selection = await lambdaAPIAuthSelection();
  
   if (selection.selection === 'IAM') {
  const files = [
    'appsync-todo/iam/build.gradle.ejs',
    'appsync-todo/iam/LambdaRequestHandler.java.ejs',
    'appsync-todo/iam/RequestClass.java.ejs',
    'appsync-todo/iam/ResponseClass.java.ejs',
    'appsync-todo/iam/event.json',
  ];
  const handlerSource = path.join('src', 'main', 'java', 'example', 'LambdaRequestHandler.java');

  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: handlerSource,
      destMap: {
        'appsync-todo/iam/build.gradle.ejs': path.join('build.gradle'),
        'appsync-todo/iam/event.json': path.join('src', 'event.json'),
        'appsync-todo/iam/LambdaRequestHandler.java.ejs': path.join('src', 'main', 'java', 'example', 'LambdaRequestHandler.java'),
        'appsync-todo/iam/RequestClass.java.ejs': path.join('src', 'main', 'java', 'example', 'RequestClass.java'),
        'appsync-todo/iam/ResponseClass.java.ejs': path.join('src', 'main', 'java', 'example', 'ResponseClass.java'),
      },
    },
  };
  }
  
  const files = [
    'appsync-todo/api_key/build.gradle.ejs',
    'appsync-todo/api_key/LambdaRequestHandler.java.ejs',
    'appsync-todo/api_key/RequestClass.java.ejs',
    'appsync-todo/api_key/ResponseClass.java.ejs',
    'appsync-todo/api_key/event.json',
  ];
  const handlerSource = path.join('src', 'main', 'java', 'example', 'LambdaRequestHandler.java');

  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: handlerSource,
      destMap: {
        'appsync-todo/api_key/build.gradle.ejs': path.join('build.gradle'),
        'appsync-todo/api_key/event.json': path.join('src', 'event.json'),
        'appsync-todo/api_key/LambdaRequestHandler.java.ejs': path.join('src', 'main', 'java', 'example', 'LambdaRequestHandler.java'),
        'appsync-todo/api_key/RequestClass.java.ejs': path.join('src', 'main', 'java', 'example', 'RequestClass.java'),
        'appsync-todo/api_key/ResponseClass.java.ejs': path.join('src', 'main', 'java', 'example', 'ResponseClass.java'),
      },
    },
  };
  
}
