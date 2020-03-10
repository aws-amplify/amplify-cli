import { FunctionParameters } from "amplify-function-plugin-interface";
import {TEMPLATE_ROOT} from '../utils/constants'
import path from 'path'
import fs from 'fs-extra'

const PATH_TO_TEMPLATE = path.join(TEMPLATE_ROOT, 'lambda/serverless');

export function provideServerless(params: FunctionParameters): Promise<FunctionParameters> {
  return Promise.resolve({
      functionTemplate: {
        sourceRoot: PATH_TO_TEMPLATE,
        sourceFiles: fs.readdirSync(PATH_TO_TEMPLATE),
        parameters: {
          path: '/item',
          expressPath: '/item',
        },
        defaultEditorFile: 'app.js',
      }
  });
}