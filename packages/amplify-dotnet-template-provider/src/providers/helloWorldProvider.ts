import { FunctionTemplateParameters, ContributionRequest } from 'amplify-function-plugin-interface';
import { templateRoot } from '../utils/constants';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import { getDstMap } from '../utils/destFileMapper';

const pathToTemplateFiles = path.join(templateRoot, 'lambda');

export async function provideHelloWorld(request: ContributionRequest): Promise<FunctionTemplateParameters> {
  const files = [
    'HelloWorld/aws-lambda-tools-defaults.json.ejs',
    'HelloWorld/Function.csproj.ejs',
    'HelloWorld/FunctionHandler.cs.ejs',
    'HelloWorld/event.json',
    'InvocationShim/InvocationShim.csproj.ejs',
    'InvocationShim/MockContext.cs.ejs',
    'InvocationShim/MockLogger.cs',
    'InvocationShim/Program.cs.ejs',
  ];
  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: path.join('src', 'Handler.cs'),
      destMap: {
        'HelloWorld/aws-lambda-tools-defaults.json.ejs': path.join(
          'src',
          request.contributionContext.functionName,
          'aws-lambda-tools-defaults.json',
        ),
        'HelloWorld/Function.csproj.ejs': path.join(
          'src',
          request.contributionContext.functionName,
          `${request.contributionContext.functionName}.csproj`,
        ),
        'HelloWorld/FunctionHandler.cs.ejs': path.join(
          'src',
          request.contributionContext.functionName,
          `${request.contributionContext.functionName}.cs`,
        ),
        'HelloWorld/event.json': path.join('src', request.contributionContext.functionName, 'event.json'),
        'InvocationShim/InvocationShim.csproj.ejs': path.join('src', 'InvocationShim/InvocationShim.csproj'),
        'InvocationShim/MockContext.cs.ejs': path.join('src', 'InvocationShim/MockContext.cs'),
        'InvocationShim/MockLogger.cs': path.join('src', 'InvocationShim/MockLogger.cs'),
        'InvocationShim/Program.cs.ejs': path.join('src', 'InvocationShim/Program.cs'),
      },
    },
  };
}
