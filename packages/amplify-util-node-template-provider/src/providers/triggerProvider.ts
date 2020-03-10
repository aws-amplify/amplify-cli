import { FunctionParameters } from "amplify-function-plugin-interface";
import {TEMPLATE_ROOT} from '../utils/constants'
import path from 'path'
import { askEventSourceQuestions } from "../utils/eventSourceWalkthrough";

const PATH_TO_TEMPLATES = path.join(TEMPLATE_ROOT, 'lambda/trigger');

// TODO need to set propert values for template files
export async function provideTrigger(context: any, params: FunctionParameters): Promise<FunctionParameters> {
  const eventSourceAnswers: any = await askEventSourceQuestions(context);
  const templateFile = eventSourceAnswers.triggerEventSourceMappings[0].functionTemplateName as string;
  return {
    triggerEventSourceMappings: eventSourceAnswers.triggerEventSourceMappings,
    dependsOn: eventSourceAnswers.dependsOn,
    functionTemplate: {
      sourceRoot: PATH_TO_TEMPLATES,
      sourceFiles: [templateFile, 'package.json.ejs', 'event.json'],
      destMap: {
        [templateFile]: 'index.js',
      }
    }
  }
}