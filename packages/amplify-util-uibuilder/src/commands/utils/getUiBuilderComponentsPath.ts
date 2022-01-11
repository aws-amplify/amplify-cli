import path from 'path';
import fs from 'fs-extra';
import { extractArgs } from './extractArgs';
import { $TSContext } from 'amplify-cli-core';

export const getUiBuilderComponentsPath = (context: $TSContext) => {
  const args = extractArgs(context);
  const srcDir = args.srcDir ? args.srcDir : context.exeInfo.projectConfig.javascript.config.SourceDir;
  const uiBuilderComponentsPath = path.resolve(path.join('.', srcDir, 'ui-components'));

  if (!fs.existsSync(uiBuilderComponentsPath)) {
    fs.mkdirpSync(uiBuilderComponentsPath);
  }

  return uiBuilderComponentsPath;
};
