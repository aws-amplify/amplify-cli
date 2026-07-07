//TODO Remove this whole function once write-object-as-json removed from everywhere
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

export function writeObjectAsJson(dest, obj, pretty) {
  JSONUtilities.writeJson(dest, obj, {
    minify: !pretty,
  });
}
