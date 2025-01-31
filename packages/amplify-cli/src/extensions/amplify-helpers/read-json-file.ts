//TODO Remove this whole function once read-json removed from everywhere
import { JSONUtilities, $TSAny } from '@aws-amplify/amplify-cli-core';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function readJsonFile(jsonFilePath, encoding = 'utf8', throwOnError = true): $TSAny {
  return JSONUtilities.readJson(jsonFilePath, {
    throwIfNotExist: throwOnError,
  });
}
