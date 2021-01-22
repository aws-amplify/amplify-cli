import { JSONUtilities, pathManager, $TSAny, $TSContext } from 'amplify-cli-core';
import * as path from 'path';

export function leaveBreadcrumbs(context: $TSContext, category: string, resourceName: string, breadcrumbs: $TSAny) {
  const destPath = path.join(pathManager.getBackendDirPath(), category, resourceName, context.amplify.constants.BreadcrumbsFileName);
  JSONUtilities.writeJson(destPath, breadcrumbs);
}
