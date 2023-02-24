import * as path from 'path';
import { JSONUtilities, pathManager, toolkitExtensions } from 'amplify-cli-core';
import { leaveBreadcrumbs } from './leave-breadcrumbs';

const { amplifyCLIConstants } = toolkitExtensions;

export function readBreadcrumbs(category: string, resourceName: string) {
  const breadcrumbsPath = path.join(pathManager.getBackendDirPath(), category, resourceName, amplifyCLIConstants.BreadcrumbsFileName);
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
