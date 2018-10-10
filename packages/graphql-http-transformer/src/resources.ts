import Table, { GlobalSecondaryIndex, KeySchema, Projection, ProvisionedThroughput, AttributeDefinition } from 'cloudform/types/dynamoDb/table'
import Resolver from 'cloudform/types/appSync/resolver'
import Template from 'cloudform/types/template'
import { Fn, Refs, AppSync } from 'cloudform'
import {
    HttpMappingTemplate, str, print, printBlock, qref,
    ref, obj, set, nul,
    ifElse, compoundExpression, bool, equals, iff, raw, Expression, comment, or, and, parens
} from 'graphql-mapping-template'
import { InputValueDefinitionNode } from 'graphql'
import { ResourceConstants, ModelResourceIDs, HttpResourceIDs, makeNonNullType } from 'graphql-transformer-common'
import { InvalidDirectiveError } from 'graphql-transformer-core';

export class ResourceFactory {

    public makeParams() {
        return {}
    }

    /**
     * Creates the barebones template for an application.
     */
    public initTemplate(): Template {
        return {
            Parameters: this.makeParams(),
            Resources: {},
            Outputs: {}
        }
    }

    public makeHttpDataSource(baseURL: string) {
        return new AppSync.DataSource({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Name: HttpResourceIDs.HttpDataSourceID(baseURL),
            Type: 'HTTP',
            HttpConfig: {
                Endpoint: baseURL
            }
        })
    }

    private makeVtlStringArray(inputArray: string[]) {
        let returnArray = `[`
        inputArray.forEach((e: string) => returnArray += `\'${e}\', `)
        return returnArray.slice(0, -2) + `]`
    }

    private makeNonNullChecks(nonNullArgs: string[]) {
        return compoundExpression([
            comment("START: Manually checking that all non-null arguments are provided either in the query or the body"),
            iff(
                or(nonNullArgs.map(
                    (arg: string) => parens(and([raw(`!$ctx.args.body.${arg}`), raw(`!$ctx.args.query.${arg}`)]))
                    )
                ),
                ref('util.error("An argument you marked as Non-Null is not present ' +
                    'in the query nor the body of your request."))')
            ),
            comment("END: Manually checking that all non-null arguments are provided either in the query or the body"),
        ])
    }

    /**
     * Create a resolver that makes a GET request. It assumes the endpoint expects query parameters in the exact
     * shape of the input arguments to the http directive. Returns the result in JSON format, or an error if the status code
     * is not 200
     * @param type
     */
    public makeGetResolver(baseURL: string, path: string, type: string, field: string) {
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(HttpResourceIDs.HttpDataSourceID(baseURL), 'Name'),
            FieldName: field,
            TypeName: type,
            RequestMappingTemplate: print(
                compoundExpression([
                    set(ref('headers'), ref('utils.http.copyHeaders($ctx.request.headers)')),
                    qref('$headers.put("accept-encoding", "application/json")'),
                    HttpMappingTemplate.getRequest({
                        resourcePath: path,
                        params: obj({
                            query: ref('util.toJson($ctx.args.query)'),
                            headers: ref('util.toJson($headers)')
                        })
                    }),
                ])
            ),
            ResponseMappingTemplate: print(
                ifElse(
                    raw('$ctx.result.statusCode == 200'),
                    ifElse(
                        ref('ctx.result.headers.get("Content-Type").toLowerCase().contains("xml")'),
                        ref('utils.xml.toJsonString($ctx.result.body)'),
                        ref('ctx.result.body')
                    ),
                    ref('util.qr($util.appendError($ctx.result.body, $ctx.result.statusCode))')
                )
            )
        })//.dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    /**
     * Create a resolver that makes a POST request. It allows the user to provide arguments as either query
     * parameters or in the body of the request.
     * request. Returns the result in JSON format, or an error if the status code is not 200.
     * Forwards the headers from the request, adding that the content type is JSON.
     * @param type
     */
    public makePostResolver(
        baseURL: string,
        path: string,
        type: string,
        field: string,
        nonNullArgs: string[]
    ) {
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(HttpResourceIDs.HttpDataSourceID(baseURL), 'Name'),
            FieldName: field,
            TypeName: type,
            RequestMappingTemplate: print(
                compoundExpression([
                    nonNullArgs.length > 0 ? this.makeNonNullChecks(nonNullArgs) : null,
                    set(ref('headers'), ref('utils.http.copyHeaders($ctx.request.headers)')),
                    qref('$headers.put("Content-Type", "application/json")'),
                    qref('$headers.put("accept-encoding", "application/json")'),
                    HttpMappingTemplate.postRequest({
                        resourcePath: path,
                        params: obj({
                            body: ref('util.toJson($ctx.args.body)'),
                            query: ref('util.toJson($ctx.args.query)'),
                            headers: ref('util.toJson($headers)')
                        })
                    }),
                ])
            ),
            ResponseMappingTemplate: print(
                ifElse(
                    raw('$ctx.result.statusCode == 200 || $ctx.result.statusCode == 201'),
                    // check if the content type returned is XML, and convert to JSON if so
                    ifElse(
                        ref('ctx.result.headers.get("Content-Type").toLowerCase().contains("xml")'),
                        ref('utils.xml.toJsonString($ctx.result.body)'),
                        ref('ctx.result.body')
                    ),
                    ref('util.qr($util.appendError($ctx.result.body, $ctx.result.statusCode))')
                )
            )
        })//.dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    /**
     * Create a resolver that makes a PUT request. It allows the user to provide arguments as either query
     * parameters or in the body of the request.
     * Returns the result in JSON format, or an error if the status code is not 200.
     * Forwards the headers from the request, adding that the content type is JSON.
     * @param type
     */
    public makePutResolver(
        baseURL: string,
        path: string,
        type: string,
        field: string,
        nonNullArgs: string[]
    ) {
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(HttpResourceIDs.HttpDataSourceID(baseURL), 'Name'),
            FieldName: field,
            TypeName: type,
            RequestMappingTemplate: print(
                compoundExpression([
                    nonNullArgs.length > 0 ? this.makeNonNullChecks(nonNullArgs) : null,
                    set(ref('headers'), ref('utils.http.copyHeaders($ctx.request.headers)')),
                    qref('$headers.put("Content-Type", "application/json")'),
                    qref('$headers.put("accept-encoding", "application/json")'),
                    HttpMappingTemplate.putRequest({
                        resourcePath: path,
                        params: obj({
                            body: ref('util.toJson($ctx.args.body)'),
                            query: ref('util.toJson($ctx.args.query)'),
                            headers: ref('util.toJson($headers)')
                        })
                    }),
                ])
            ),
            ResponseMappingTemplate: print(
                ifElse(
                    raw('$ctx.result.statusCode == 200 || $ctx.result.statusCode == 201'),
                    ifElse(
                        ref('ctx.result.headers.get("Content-Type").toLowerCase().contains("xml")'),
                        ref('utils.xml.toJsonString($ctx.result.body)'),
                        ref('ctx.result.body')
                    ),
                    ref('util.qr($util.appendError($ctx.result.body, $ctx.result.statusCode))')
                )
            )
        })//.dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    /**
     * Create a resolver that makes a DELETE request.
     * @param type
     */
    public makeDeleteResolver(baseURL: string, path: string, type: string, field: string) {
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(HttpResourceIDs.HttpDataSourceID(baseURL), 'Name'),
            FieldName: field,
            TypeName: type,
            RequestMappingTemplate: print(
                compoundExpression([
                    set(ref('headers'), ref('utils.http.copyHeaders($ctx.request.headers)')),
                    qref('$headers.put("accept-encoding", "application/json")'),
                    HttpMappingTemplate.deleteRequest({
                        resourcePath: path,
                        params: obj({
                            headers: ref('util.toJson($headers)')
                        })
                    }),
                ])
            ),
            ResponseMappingTemplate: print(
                ifElse(
                    raw('$ctx.result.statusCode == 200'),
                    ifElse(
                        ref('ctx.result.headers.get("Content-Type").toLowerCase().contains("xml")'),
                        ref('utils.xml.toJsonString($ctx.result.body)'),
                        ref('ctx.result.body')
                    ),
                    ref('util.qr($util.appendError($ctx.result.body, $ctx.result.statusCode))')
                )
            )
        })//.dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    /**
     * Create a resolver that makes a PUT request. It allows the user to provide arguments as either query
     * parameters or in the body of the request.
     * Returns the result in JSON format, or an error if the status code is not 200.
     * Forwards the headers from the request, adding that the content type is JSON.
     * @param type
     */
    public makePatchResolver(
        baseURL: string,
        path: string,
        type: string,
        field: string,
        nonNullArgs: string[]
    ) {
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(HttpResourceIDs.HttpDataSourceID(baseURL), 'Name'),
            FieldName: field,
            TypeName: type,
            RequestMappingTemplate: print(
                compoundExpression([
                    nonNullArgs.length > 0 ? this.makeNonNullChecks(nonNullArgs) : null,
                    set(ref('headers'), ref('utils.http.copyHeaders($ctx.request.headers)')),
                    qref('$headers.put("Content-Type", "application/json")'),
                    qref('$headers.put("accept-encoding", "application/json")'),
                    HttpMappingTemplate.patchRequest({
                        resourcePath: path,
                        params: obj({
                            body: ref('util.toJson($ctx.args.body)'),
                            query: ref('util.toJson($ctx.args.query)'),
                            headers: ref('util.toJson($headers)')
                        })
                    }),
                ])
            ),
            ResponseMappingTemplate: print(
                ifElse(
                    raw('$ctx.result.statusCode == 200 || $ctx.result.statusCode == 201'),
                    ifElse(
                        ref('ctx.result.headers.get("Content-Type").toLowerCase().contains("xml")'),
                        ref('utils.xml.toJsonString($ctx.result.body)'),
                        ref('ctx.result.body')
                    ),
                    ref('util.qr($util.appendError($ctx.result.body, $ctx.result.statusCode))')
                )
            )
        })//.dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }
}
