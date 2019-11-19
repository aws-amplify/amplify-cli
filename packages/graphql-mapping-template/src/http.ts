import { obj, Expression, str, ObjectNode, iff, ifElse, ref, raw, int, CompoundExpressionNode, compoundExpression, set, qref } from './ast';

export class HttpMappingTemplate {
  static RESOLVER_VERSION_ID = '2018-05-29';

  /**
   * Create a mapping template for HTTP GET requests.
   */
  public static getRequest({ resourcePath, params }: { resourcePath: string; params: ObjectNode }): ObjectNode {
    return obj({
      version: str(this.RESOLVER_VERSION_ID),
      method: str('GET'),
      resourcePath: str(resourcePath),
      params,
    });
  }

  /**
   * Create a mapping template for HTTP POST requests.
   */
  public static postRequest({ resourcePath, params }: { resourcePath: string; params: ObjectNode }): ObjectNode {
    return obj({
      version: str(this.RESOLVER_VERSION_ID),
      method: str('POST'),
      resourcePath: str(resourcePath),
      params,
    });
  }

  /**
   * Create a mapping template for HTTP PUT requests.
   */
  public static putRequest({ resourcePath, params }: { resourcePath: string; params: ObjectNode }): ObjectNode {
    return obj({
      version: str(this.RESOLVER_VERSION_ID),
      method: str('PUT'),
      resourcePath: str(resourcePath),
      params,
    });
  }

  /**
   * Create a mapping template for HTTP DELETE requests.
   */
  public static deleteRequest({ resourcePath, params }: { resourcePath: string; params: ObjectNode }): ObjectNode {
    return obj({
      version: str(this.RESOLVER_VERSION_ID),
      method: str('DELETE'),
      resourcePath: str(resourcePath),
      params,
    });
  }

  /**
   * Create a mapping template for HTTP PATCH requests.
   */
  public static patchRequest({ resourcePath, params }: { resourcePath: string; params: ObjectNode }): ObjectNode {
    return obj({
      version: str(this.RESOLVER_VERSION_ID),
      method: str('PATCH'),
      resourcePath: str(resourcePath),
      params,
    });
  }
}
