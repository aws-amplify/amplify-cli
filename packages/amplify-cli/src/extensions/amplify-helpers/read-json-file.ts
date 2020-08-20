//TODO Remove this whole function once read-json removed from everywhere
import { JSONUtilities, $TSAny } from 'amplify-cli-core';

export function readJsonFile(jsonFilePath, encoding = 'utf8', throwOnError = true): $TSAny {
  return JSONUtilities.readJson(jsonFilePath, {
    throwIfNotExist: throwOnError,
  });
}
