import path from 'path';
import fs from 'fs-extra';
import { $TSContext } from 'amplify-cli-core';
import { extractArgs } from './extractArgs';

/**
 *
 * locates components path directory
 */
export const getUiBuilderComponentsPath = (context: $TSContext): string => {
  const args = extractArgs(context);
  const srcDir = args.srcDir ? args.srcDir : context.exeInfo.projectConfig.javascript.config.SourceDir;
  const uiBuilderComponentsPath = path.resolve(path.join('.', srcDir, 'ui-components'));

  if (!fs.existsSync(uiBuilderComponentsPath)) {
    // eslint-disable-next-line spellcheck/spell-checker
    fs.mkdirpSync(uiBuilderComponentsPath);
  }

  return uiBuilderComponentsPath;
};
