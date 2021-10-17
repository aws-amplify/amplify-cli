export { TemplateSentError, Unauthorized, ValidateError } from './errors';
import { generalUtils } from './general-utils';
import { dynamodbUtils } from './dynamodb-utils';
import { listUtils } from './list-utils';
import { mapUtils } from './map-utils';
import { authUtils } from './auth-utils';
import { transformUtils } from './transform';
import { time } from './time';
import { rds } from './rds';
import { str } from './str';
import { math } from './math';
import { GraphQLResolveInfo } from 'graphql';
import { AppSyncGraphQLExecutionContext } from '../../utils/graphql-runner';
export function create(errors = [], now: Date = new Date(), info: GraphQLResolveInfo, context: AppSyncGraphQLExecutionContext) {
  return {
    ...authUtils(context),
    ...generalUtils,
    dynamodb: dynamodbUtils,
    list: listUtils,
    map: mapUtils,
    transform: transformUtils,
    now,
    errors,
    info,
    time: time(),
    str,
    math,
    rds,
  };
}
