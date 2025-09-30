import { unmarshall as awsUnmarshall, marshall as awsMarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

export function nullIfEmpty<T extends Record<string, string | AttributeValue>>(obj: T): T | null {
  return Object.keys(obj).length === 0 ? null : obj;
}

export function marshall(obj: object) {
  if (!obj || Object.keys(obj).length === 0) {
    return undefined;
  }
  return awsMarshall(obj);
}

export function unmarshall(raw, isRaw = true) {
  const content = isRaw ? awsUnmarshall(raw) : raw;
  // Because of the funky set type used in the aws-sdk, we need to further unwrap
  // to find if there is a set that needs to be unpacked into an array.

  // Unwrap sets
  if (content && typeof content === 'object' && content.wrapperName === 'Set') {
    return content.values;
  }

  // Unwrap lists
  if (Array.isArray(content)) {
    return content.map((value) => unmarshall(value, false));
  }

  // Unwrap maps
  if (content && typeof content === 'object') {
    return Object.entries(content).reduce(
      (sum, [key, value]) => ({
        ...sum,
        [key]: unmarshall(value, false),
      }),
      {},
    );
  }

  return content;
}
