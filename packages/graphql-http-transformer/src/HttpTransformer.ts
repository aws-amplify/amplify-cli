import { Transformer, TransformerContext, InvalidDirectiveError } from 'graphql-transformer-core'
import Table from 'cloudform/types/dynamoDb/table'
import {
    DirectiveNode, ObjectTypeDefinitionNode,
    Kind, FieldDefinitionNode, InterfaceTypeDefinitionNode,
    InputValueDefinitionNode, StringValueNode
} from 'graphql'
import { ResourceFactory } from './resources'
import {
    makeModelConnectionType,
    makeModelConnectionField,
    makeScalarFilterInputs,
    makeModelXFilterInputObject,
    makeModelSortDirectionEnumObject,
} from 'graphql-dynamodb-transformer'
import {
    getBaseType, isListType, getDirectiveArgument, blankObject,
    toCamelCase, graphqlName
} from 'graphql-transformer-common'
import { ResolverResourceIDs, ModelResourceIDs, HttpResourceIDs } from 'graphql-transformer-common'
import { updateCreateInputWithConnectionField, updateUpdateInputWithConnectionField } from './definitions';
import { Fn } from 'cloudform';

enum HttpMethod {
    GET,
    POST,
    PUT,
    DELETE
}

interface HttpDirectiveArgs {
    method?: HttpMethod,
    url: String,
}

/**
 * The @connection transform.
 *
 * This transform configures the GSIs and resolvers needed to implement
 * relationships at the GraphQL level.
 */
export class HttpTransformer extends Transformer {

    resources: ResourceFactory

    static urlRegex = /(http(s)?:\/\/)|www\.|(\/.*)/g

    constructor() {
        super(
            'HttpTransformer',
            `
            directive @http(
                method: HttpMethod = GET,
                url: String!
            ) on FIELD_DEFINITION
            enum HttpMethod {
                GET
                POST
                PUT
                DELETE
            }
            `
        )
        this.resources = new ResourceFactory();
    }

    public before = (ctx: TransformerContext): void => {
        let directiveList: DirectiveNode[] = []

        // gather all the http directives
        for (const def of ctx.inputDocument.definitions) {
            if (def.kind === Kind.OBJECT_TYPE_DEFINITION) {
                for (const field of def.fields) {
                    const httpDirective = field.directives.find(dir => dir.name.value === 'http')
                    if (httpDirective) {
                        directiveList.push(httpDirective)
                    }
                }
            }
        }

        // create all the datasources we will need for this schema
        directiveList.forEach((value: DirectiveNode) => {
            const url = getDirectiveArgument(value)("url")
            // require a protocol in the url
            const protocolMatcher = /^http(s)?:\/\//
            if (!protocolMatcher.test(url)) {
                throw new Error(`@http directive at location ${value.loc.start} requires a url parameter that begins with http:// or https://.`)
            }
            // extract just the base url, without "www" or path information
            const baseURL = url.replace(HttpTransformer.urlRegex, '$1')
            console.log(`baseURL: ${baseURL}`)
            const dataSourceID = HttpResourceIDs.HttpDataSourceID(baseURL)
            // only create one DataSource per base URL
            if (!ctx.getResource(dataSourceID)) {
                ctx.setResource(
                    dataSourceID,
                    this.resources.makeHttpDataSource(baseURL)
                )
                console.log(ctx.getResource(dataSourceID))
            }
        })
    }

    /**
     * Create and configure the HTTP resolver for this field
     */
    public field = (
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        field: FieldDefinitionNode,
        directive: DirectiveNode,
        ctx: TransformerContext
    ): void => {

        const url = getDirectiveArgument(directive)("url")
        const baseURL = url.replace(HttpTransformer.urlRegex, '$1')
        // split the url into pieces, and get the path part off the end
        const path = url.split(/(http(s)?:\/\/|www\.)|(\/.*)/g).slice(-2, -1)
        console.log(`the path we got is ${path}`)

        let method = getDirectiveArgument(directive)("method")
        if (!method) {
            method = HttpMethod.GET
        }

        // build the payload
        switch (method) {
            case HttpMethod.GET:
                const getResourceID = ResolverResourceIDs.HttpGetResolverResourceID(url)
                if (!ctx.getResource(getResourceID)) {
                    const getResolver = this.resources.makeGetResolver(baseURL, path, parent.name.value, field.name.value)
                    ctx.setResource(getResourceID, getResolver)
                    console.log(JSON.stringify(ctx.getResource(getResourceID), null, 2))
                }
                break;
            case HttpMethod.POST:
            case HttpMethod.PUT:
            case HttpMethod.DELETE:
            default:
            // nothin
        }

    }

    private typeExist(type: string, ctx: TransformerContext): boolean {
        return Boolean(type in ctx.nodeMap);
    }
}
