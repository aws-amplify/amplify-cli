import * as path from 'path';
import { pathManager, JSONUtilities, $TSAny } from 'amplify-cli-core';

export function getUserPoolGroupList(context) {
  let userPoolGroupList = [];

  const userGroupParamsPath = path.join(pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'user-pool-group-precedence.json');

  try {
    const existingGroups = JSONUtilities.readJson<$TSAny>(userGroupParamsPath);

    userPoolGroupList = existingGroups.map(e => e.groupName);
  } catch {
    // intentionally left blank
  }

  return userPoolGroupList;
}
