import * as path from 'path';
import { JSONUtilities } from 'amplify-cli-core';

export function readBreadcrumbs(context, category, resourceName) {
  const breadcrumbsPath = path.join(
    context.amplify.pathManager.getBackendDirPath(),
    category,
    resourceName,
    context.amplify.constants.BreadcrumbsFileName,
  );
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
