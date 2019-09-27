export { TemplateSentError, Unauthorized, ValidateError } from './errors';
import { generalUtils } from './general-utils';
import { dynamodbUtils } from './dynamodb-utils';
import { listUtils } from './list-utils';
import { mapUtils } from './map-utils';
import { transformUtils } from './transform';
import { time } from './time';
import { GraphQLResolveInfo } from 'graphql';

export function create(errors = [], now: Date = new Date(), info: GraphQLResolveInfo) {
  return {
    ...generalUtils,
    dynamodb: dynamodbUtils,
    list: listUtils,
    map: mapUtils,
    transform: transformUtils,
    now,
    errors,
    info,
    time: time(),
  };
}
