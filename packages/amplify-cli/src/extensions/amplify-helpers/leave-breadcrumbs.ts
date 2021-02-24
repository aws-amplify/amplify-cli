import { JSONUtilities, pathManager } from 'amplify-cli-core';
import * as path from 'path';
import { amplifyCLIConstants } from './constants';

export function leaveBreadcrumbs(category: string, resourceName: string, breadcrumbs: unknown) {
  const destPath = path.join(pathManager.getBackendDirPath(), category, resourceName, amplifyCLIConstants.BreadcrumbsFileName);
  JSONUtilities.writeJson(destPath, breadcrumbs);
}
