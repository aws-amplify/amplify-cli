import { $TSAny, JSONUtilities, pathManager } from 'amplify-cli-core';
import * as path from 'path';

export function getUserPoolGroupList(): $TSAny[] {
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
