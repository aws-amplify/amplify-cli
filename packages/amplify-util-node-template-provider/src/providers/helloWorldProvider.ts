import { FunctionParameters } from "amplify-function-plugin-interface";
import {TEMPLATE_ROOT} from '../utils/constants'
import fs from 'fs-extra'
import path from 'path'

const PATH_TO_TEMPLATES = path.join(TEMPLATE_ROOT, 'lambda/hello-world');

export function provideHelloWorld(params: FunctionParameters): Promise<FunctionParameters> {
  return Promise.resolve({
    functionTemplate: {
      sourceRoot: PATH_TO_TEMPLATES,
      sourceFiles: fs.readdirSync(PATH_TO_TEMPLATES),
      defaultEditorFile: 'index.js',
    }
  })
}