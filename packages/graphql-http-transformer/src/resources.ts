import { AppSync, Fn, IntrinsicFunction, Value } from 'cloudform-types';
import {
  and,
  comment,
  compoundExpression,
  HttpMappingTemplate,
  ifElse,
  iff,
  obj,
  or,
  parens,
  print,
  qref,
  raw,
  ref,
  set,
} from 'graphql-mapping-template';
import { HttpResourceIDs, ResourceConstants } from 'graphql-transformer-common';
import { HttpHeader } from './HttpTransformer';
import Template from 'cloudform-types/types/template';
export class ResourceFactory {
  public makeParams() {
    return {};
  }

  /**
   * Creates the barebones template for an application.
   */
  public initTemplate(): Template {
    return {
      Parameters: this.makeParams(),
      Resources: {},
      Outputs: {},
    };
  }

  public makeHttpDataSource(baseURL: string) {
    return new AppSync.DataSource({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      Name: HttpResourceIDs.HttpDataSourceID(baseURL),
      Type: 'HTTP',
      HttpConfig: {
        Endpoint: this.replaceEnvAndRegion(baseURL),
      },
    });
  }

  private referencesEnv(value: string): boolean {
    return value.match(/(\${env})/) !== null;
  }

  private referencesRegion(value: string): boolean {
    return value.match(/(\${aws_region})/) !== null;
  }

  private replaceEnvAndRegion(value: string): Value<string> {
    const vars: {
      [key: string]: IntrinsicFunction;
    } = {};

    if (this.referencesEnv(value)) {
      vars.env = Fn.Ref(ResourceConstants.PARAMETERS.Env);
    }

    if (this.referencesRegion(value)) {
      vars.aws_region = Fn.Ref('AWS::Region');
    }

    if (!vars.env && !vars.aws_region) {
      return value;
    }

    return Fn.Sub(value, vars);
  }

  private makeVtlStringArray(inputArray: string[]) {
    let returnArray = `[`;
    inputArray.forEach((e: string) => (returnArray += `\'${e}\', `));
    return returnArray.slice(0, -2) + `]`;
  }

  private makeNonNullChecks(nonNullArgs: string[]) {
    return compoundExpression([
      comment('START: Manually checking that all non-null arguments are provided either in the query or the body'),
      iff(
        or(nonNullArgs.map((arg: string) => parens(and([raw(`!$ctx.args.body.${arg}`), raw(`!$ctx.args.query.${arg}`)])))),
        ref('util.error("An argument you marked as Non-Null is not present ' + 'in the query nor the body of your request."))'),
      ),
      comment('END: Manually checking that all non-null arguments are provided either in the query or the body'),
    ]);
  }

  /**
   * Create a resolver that makes a GET request. It assumes the endpoint expects query parameters in the exact
   * shape of the input arguments to the http directive. Returns the result in JSON format, or an error if the status code
   * is not 200
   * @param type
   */
  public makeGetResolver(baseURL: string, path: string, type: string, field: string, headers: HttpHeader[]) {
    const parsedHeaders = headers.map(header => qref(`$headers.put("${header.key}", "${header.value}")`));

    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(HttpResourceIDs.HttpDataSourceID(baseURL), 'Name'),
      FieldName: field,
      TypeName: type,
      RequestMappingTemplate: this.replaceEnvAndRegion(
        print(
          compoundExpression([
            set(ref('headers'), ref('utils.http.copyHeaders($ctx.request.headers)')),
            qref('$headers.put("accept-encoding", "application/json")'),
            ...parsedHeaders,
            HttpMappingTemplate.getRequest({
              resourcePath: path,
              params: obj({
                query: ref('util.toJson($ctx.args.query)'),
                headers: ref('util.toJson($headers)'),
              }),
            }),
          ]),
        ),
      ),
      ResponseMappingTemplate: print(
        ifElse(
          raw('$ctx.result.statusCode == 200'),
          ifElse(
            ref('ctx.result.headers.get("Content-Type").toLowerCase().contains("xml")'),
            ref('utils.xml.toJsonString($ctx.result.body)'),
            ref('ctx.result.body'),
          ),
          ref('util.qr($util.appendError($ctx.result.body, $ctx.result.statusCode))'),
        ),
      ),
    }); // .dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
  }

  /**
   * Create a resolver that makes a POST request. It allows the user to provide arguments as either query
   * parameters or in the body of the request.
   * request. Returns the result in JSON format, or an error if the status code is not 200.
   * Forwards the headers from the request, adding that the content type is JSON.
   * @param type
   */
  public makePostResolver(baseURL: string, path: string, type: string, field: string, nonNullArgs: string[], headers: HttpHeader[]) {
    const parsedHeaders = headers.map(header => qref(`$headers.put("${header.key}", "${header.value}")`));

    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(HttpResourceIDs.HttpDataSourceID(baseURL), 'Name'),
      FieldName: field,
      TypeName: type,
      RequestMappingTemplate: this.replaceEnvAndRegion(
        print(
          compoundExpression([
            nonNullArgs.length > 0 ? this.makeNonNullChecks(nonNullArgs) : null,
            set(ref('headers'), ref('utils.http.copyHeaders($ctx.request.headers)')),
            qref('$headers.put("Content-Type", "application/json")'),
            qref('$headers.put("accept-encoding", "application/json")'),
            ...parsedHeaders,
            HttpMappingTemplate.postRequest({
              resourcePath: path,
              params: obj({
                body: ref('util.toJson($ctx.args.body)'),
                query: ref('util.toJson($ctx.args.query)'),
                headers: ref('util.toJson($headers)'),
              }),
            }),
          ]),
        ),
      ),
      ResponseMappingTemplate: print(
        ifElse(
          raw('$ctx.result.statusCode == 200 || $ctx.result.statusCode == 201'),
          // check if the content type returned is XML, and convert to JSON if so
          ifElse(
            ref('ctx.result.headers.get("Content-Type").toLowerCase().contains("xml")'),
            ref('utils.xml.toJsonString($ctx.result.body)'),
            ref('ctx.result.body'),
          ),
          ref('util.qr($util.appendError($ctx.result.body, $ctx.result.statusCode))'),
        ),
      ),
    }); // .dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
  }

  /**
   * Create a resolver that makes a PUT request. It allows the user to provide arguments as either query
   * parameters or in the body of the request.
   * Returns the result in JSON format, or an error if the status code is not 200.
   * Forwards the headers from the request, adding that the content type is JSON.
   * @param type
   */
  public makePutResolver(baseURL: string, path: string, type: string, field: string, nonNullArgs: string[], headers: HttpHeader[]) {
    const parsedHeaders = headers.map(header => qref(`$headers.put("${header.key}", "${header.value}")`));

    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(HttpResourceIDs.HttpDataSourceID(baseURL), 'Name'),
      FieldName: field,
      TypeName: type,
      RequestMappingTemplate: this.replaceEnvAndRegion(
        print(
          compoundExpression([
            nonNullArgs.length > 0 ? this.makeNonNullChecks(nonNullArgs) : null,
            set(ref('headers'), ref('utils.http.copyHeaders($ctx.request.headers)')),
            qref('$headers.put("Content-Type", "application/json")'),
            qref('$headers.put("accept-encoding", "application/json")'),
            ...parsedHeaders,
            HttpMappingTemplate.putRequest({
              resourcePath: path,
              params: obj({
                body: ref('util.toJson($ctx.args.body)'),
                query: ref('util.toJson($ctx.args.query)'),
                headers: ref('util.toJson($headers)'),
              }),
            }),
          ]),
        ),
      ),
      ResponseMappingTemplate: print(
        ifElse(
          raw('$ctx.result.statusCode == 200 || $ctx.result.statusCode == 201'),
          ifElse(
            ref('ctx.result.headers.get("Content-Type").toLowerCase().contains("xml")'),
            ref('utils.xml.toJsonString($ctx.result.body)'),
            ref('ctx.result.body'),
          ),
          ref('util.qr($util.appendError($ctx.result.body, $ctx.result.statusCode))'),
        ),
      ),
    }); // .dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
  }

  /**
   * Create a resolver that makes a DELETE request.
   * @param type
   */
  public makeDeleteResolver(baseURL: string, path: string, type: string, field: string, headers: HttpHeader[]) {
    const parsedHeaders = headers.map(header => qref(`$headers.put("${header.key}", "${header.value}")`));

    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(HttpResourceIDs.HttpDataSourceID(baseURL), 'Name'),
      FieldName: field,
      TypeName: type,
      RequestMappingTemplate: this.replaceEnvAndRegion(
        print(
          compoundExpression([
            set(ref('headers'), ref('utils.http.copyHeaders($ctx.request.headers)')),
            qref('$headers.put("accept-encoding", "application/json")'),
            ...parsedHeaders,
            HttpMappingTemplate.deleteRequest({
              resourcePath: path,
              params: obj({
                headers: ref('util.toJson($headers)'),
              }),
            }),
          ]),
        ),
      ),
      ResponseMappingTemplate: print(
        ifElse(
          raw('$ctx.result.statusCode == 200'),
          ifElse(
            ref('ctx.result.headers.get("Content-Type").toLowerCase().contains("xml")'),
            ref('utils.xml.toJsonString($ctx.result.body)'),
            ref('ctx.result.body'),
          ),
          ref('util.qr($util.appendError($ctx.result.body, $ctx.result.statusCode))'),
        ),
      ),
    }); // .dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
  }

  /**
   * Create a resolver that makes a PUT request. It allows the user to provide arguments as either query
   * parameters or in the body of the request.
   * Returns the result in JSON format, or an error if the status code is not 200.
   * Forwards the headers from the request, adding that the content type is JSON.
   * @param type
   */
  public makePatchResolver(baseURL: string, path: string, type: string, field: string, nonNullArgs: string[], headers: HttpHeader[]) {
    const parsedHeaders = headers.map(header => qref(`$headers.put("${header.key}", "${header.value}")`));

    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: Fn.GetAtt(HttpResourceIDs.HttpDataSourceID(baseURL), 'Name'),
      FieldName: field,
      TypeName: type,
      RequestMappingTemplate: this.replaceEnvAndRegion(
        print(
          compoundExpression([
            nonNullArgs.length > 0 ? this.makeNonNullChecks(nonNullArgs) : null,
            set(ref('headers'), ref('utils.http.copyHeaders($ctx.request.headers)')),
            qref('$headers.put("Content-Type", "application/json")'),
            qref('$headers.put("accept-encoding", "application/json")'),
            ...parsedHeaders,
            HttpMappingTemplate.patchRequest({
              resourcePath: path,
              params: obj({
                body: ref('util.toJson($ctx.args.body)'),
                query: ref('util.toJson($ctx.args.query)'),
                headers: ref('util.toJson($headers)'),
              }),
            }),
          ]),
        ),
      ),
      ResponseMappingTemplate: print(
        ifElse(
          raw('$ctx.result.statusCode == 200 || $ctx.result.statusCode == 201'),
          ifElse(
            ref('ctx.result.headers.get("Content-Type").toLowerCase().contains("xml")'),
            ref('utils.xml.toJsonString($ctx.result.body)'),
            ref('ctx.result.body'),
          ),
          ref('util.qr($util.appendError($ctx.result.body, $ctx.result.statusCode))'),
        ),
      ),
    }); // .dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
  }
}
