import * as path from 'path';
<<<<<<< HEAD
import { JSONUtilities, pathManager, $TSAny, $TSContext } from 'amplify-cli-core';

export function readBreadcrumbs(context: $TSContext, category: string, resourceName: string): $TSAny {
  const breadcrumbsPath = path.join(pathManager.getBackendDirPath(), category, resourceName, context.amplify.constants.BreadcrumbsFileName);
=======
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { amplifyCLIConstants } from './constants';
import { leaveBreadcrumbs } from './leave-breadcrumbs';

export function readBreadcrumbs(category: string, resourceName: string) {
  const breadcrumbsPath = path.join(pathManager.getBackendDirPath(), category, resourceName, amplifyCLIConstants.BreadcrumbsFileName);
>>>>>>> chore: separate func invoke and build
  let breadcrumbs = JSONUtilities.readJson(breadcrumbsPath, {
    throwIfNotExist: false,
  });

  if (!breadcrumbs) {
    breadcrumbs = {
      pluginId: 'amplify-nodejs-function-runtime-provider',
      functionRuntime: 'nodejs',
      defaultEditorFile: 'src/index.js',
      useLegacyBuild: true,
    };

    leaveBreadcrumbs(category, resourceName, breadcrumbs);
  }
  return breadcrumbs;
}
