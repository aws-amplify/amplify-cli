import { FunctionTemplateParameters, ContributionRequest } from 'amplify-function-plugin-interface';
import { templateRoot } from '../utils/constants';
import { shimSourceFiles, shimMappings } from './shimProvider';
import path from 'path';

const pathToTemplateFiles = path.join(templateRoot, 'lambda');

export async function provideHelloWorld(request: ContributionRequest): Promise<FunctionTemplateParameters> {
  const files = [
    'HelloWorld/aws-lambda-tools-defaults.json.ejs',
    'HelloWorld/Function.csproj.ejs',
    'HelloWorld/FunctionHandler.cs.ejs',
    'HelloWorld/event.json',
    ...shimSourceFiles(),
  ];
  const handlerSource = path.join('src', request.contributionContext.functionName, `${request.contributionContext.functionName}.cs`);
  return {
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      defaultEditorFile: handlerSource,
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
        'HelloWorld/FunctionHandler.cs.ejs': handlerSource,
        'HelloWorld/event.json': path.join('src', 'event.json'),
        ...shimMappings(),
      },
    },
  };
}
