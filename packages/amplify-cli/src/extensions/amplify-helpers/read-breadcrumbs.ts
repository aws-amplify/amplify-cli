import * as path from 'path';
import { JSONUtilities, pathManager, $TSAny, $TSContext } from 'amplify-cli-core';

export function readBreadcrumbs(context: $TSContext, category: string, resourceName: string): $TSAny {
  const breadcrumbsPath = path.join(pathManager.getBackendDirPath(), category, resourceName, context.amplify.constants.BreadcrumbsFileName);
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

    context.amplify.leaveBreadcrumbs(context, category, resourceName, breadcrumbs);
  }
  return breadcrumbs;
}
