import { print } from './print';
import {
  obj,
  Expression,
  str,
  ObjectNode,
  iff,
  ifElse,
  ref,
  raw,
  int,
  CompoundExpressionNode,
  compoundExpression,
  set,
  qref,
  ListNode,
} from './ast';

const RESOLVER_VERSION_ID = '2018-05-29';

export class ElasticsearchMappingTemplate {
  /**
   * Create a mapping template for ES.
   */
  public static genericTemplte({
    operation,
    path,
    params,
  }: {
    operation: Expression;
    path: Expression;
    params: Expression | ObjectNode | CompoundExpressionNode;
  }): ObjectNode {
    return obj({
      version: str(RESOLVER_VERSION_ID),
      operation,
      path,
      params,
    });
  }

  /**
   * Create a search item resolver template.
   * @param size the size limit
   * @param from the next token
   * @param query the query
   */
  public static searchItem({
    query,
    size,
    search_after,
    path,
    sort,
  }: {
    path: Expression;
    sort?: Expression | ObjectNode;
    query?: ObjectNode | Expression;
    size?: Expression;
    search_after?: Expression | ListNode;
  }): ObjectNode {
    return obj({
      version: str(RESOLVER_VERSION_ID),
      operation: str('GET'),
      path,
      params: obj({
        body: raw(`{
                #if( $context.args.nextToken )"search_after": ${print(search_after)}, #end
                "size": ${print(size)},
                "sort": ${print(sort)},
                "query": ${print(query)}
                }`),
      }),
    });
  }
}
