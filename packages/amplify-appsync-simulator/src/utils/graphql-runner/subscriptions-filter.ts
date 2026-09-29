import { inspect } from 'util';

const log = console;

export function filterSubscriptions(payload: object | null, variables: object) {
  if (payload == null) {
    log.warn('Subscription payload is null; Publishing will be skipped');
    return false;
  }

  const variableEntries = Object.entries(variables || {});

  if (!variableEntries.length) {
    return true;
  }

  // every variable key/value pair must match corresponding payload key/value pair
  const variableResult = variableEntries.every(([variableKey, variableValue]) => payload[variableKey] === variableValue);

  if (!variableResult) {
    log.warn('Subscription payload did not match variables');
    log.warn('Payload:');
    log.warn(inspect(payload));
    log.warn('Variables:');
    log.warn(inspect(variables));
    return false;
  }

  return true;
}
