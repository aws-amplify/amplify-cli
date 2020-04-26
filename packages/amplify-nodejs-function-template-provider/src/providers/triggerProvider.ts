import { FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import { templateRoot } from '../utils/constants';
import path from 'path';
import { askEventSourceQuestions } from '../utils/eventSourceWalkthrough';

const pathToTemplateFiles = path.join(templateRoot, 'lambda/trigger');

export async function provideTrigger(context: any): Promise<FunctionTemplateParameters> {
  const eventSourceAnswers: any = await askEventSourceQuestions(context);
  const templateFile = eventSourceAnswers.triggerEventSourceMappings[0].functionTemplateName as string;
  const files = [templateFile, 'package.json.ejs', 'event.json'];
  return {
    triggerEventSourceMappings: eventSourceAnswers.triggerEventSourceMappings,
    dependsOn: eventSourceAnswers.dependsOn,
    functionTemplate: {
      sourceRoot: pathToTemplateFiles,
      sourceFiles: files,
      destMap: {
        [templateFile]: path.join('src', 'index.js'),
        'package.json.ejs': path.join('src', 'package.json'),
        'event.json': path.join('src', 'event.json'),
      },
      defaultEditorFile: path.join('src', 'index.js'),
    },
  };
}
