export { TemplateSentError, Unauthorized, ValidateError } from './errors';
import { generalUtils } from './general-utils';
import { dynamodbUtils } from './dynamodb-utils';
import { listUtils } from './list-utils';
import { mapUtils } from './map-utils';
import { transformUtils } from './transform';
import { time } from './time';

export function create(errors = [], now: Date = new Date()) {
  return {
    ...generalUtils,
    dynamodb: dynamodbUtils,
    list: listUtils,
    map: mapUtils,
    transform: transformUtils,
    now,
    errors,
    time: time(now),
  };
}
