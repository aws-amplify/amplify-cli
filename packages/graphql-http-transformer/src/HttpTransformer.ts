import { Transformer, TransformerContext } from 'graphql-transformer-core'
import {
    DirectiveNode, ObjectTypeDefinitionNode,
    Kind, FieldDefinitionNode, InterfaceTypeDefinitionNode
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
    getDirectiveArgument
} from 'graphql-transformer-common'
import { ResolverResourceIDs, HttpResourceIDs } from 'graphql-transformer-common'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface HttpDirectiveArgs {
    method?: HttpMethod,
    url: String,
}

/**
 * The @http transform.
 *
 * This transform attaches http resolvers to any fields with the @http directive.
 * Works with GET, POST, PUT, DELETE requests.
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
            const dataSourceID = HttpResourceIDs.HttpDataSourceID(baseURL)
            // only create one DataSource per base URL
            if (!ctx.getResource(dataSourceID)) {
                ctx.setResource(
                    dataSourceID,
                    this.resources.makeHttpDataSource(baseURL)
                )
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

        const url: string = getDirectiveArgument(directive)("url")
        const baseURL: string = url.replace(HttpTransformer.urlRegex, '$1')
        // split the url into pieces, and get the path part off the end
        const path: string = url.split(/(http(s)?:\/\/|www\.)|(\/.*)/g).slice(-2, -1)[0]

        let urlParams: string[] = path.match(/:\w+/g)
        let pathWithParams

        if (urlParams) {
            /**
             * TODO: add logic that checks if any of the arguments match any of the URL parameters in the path,
             * and replace them in the resolver template if so
             */
            pathWithParams = path.replace(/:\w+/g, (str: string) => {
                return `\$\{ctx.args.${str.replace(':', '')}\}`
            })
            // then actually replace?
        }

        let method: HttpMethod = getDirectiveArgument(directive)("method")
        if (!method) {
            method = 'GET'
        }
        // build the payload
        switch (method) {
            case 'GET':
                const getResourceID = ResolverResourceIDs.ResolverResourceID(parent.name.value, field.name.value)
                if (!ctx.getResource(getResourceID)) {
                    const getResolver = this.resources.makeGetResolver(baseURL, path, parent.name.value, field.name.value)
                    ctx.setResource(getResourceID, getResolver)
                }
                break;
            case 'POST':
                const postResourceID = ResolverResourceIDs.ResolverResourceID(parent.name.value, field.name.value)
                if (!ctx.getResource(postResourceID)) {
                    const postResolver = this.resources.makePostResolver(baseURL, path, parent.name.value, field.name.value)
                    ctx.setResource(postResourceID, postResolver)
                }
                break;
            case 'PUT':
                const putResourceID = ResolverResourceIDs.ResolverResourceID(parent.name.value, field.name.value)
                if (!ctx.getResource(putResourceID)) {
                    const putResolver = this.resources.makePutResolver(baseURL, path, parent.name.value, field.name.value)
                    ctx.setResource(putResourceID, putResolver)
                }
                break;
            case 'DELETE':
                const deleteResourceID = ResolverResourceIDs.ResolverResourceID(parent.name.value, field.name.value)
                if (!ctx.getResource(deleteResourceID)) {
                    const deleteResolver = this.resources.makeDeleteResolver(baseURL, path, parent.name.value, field.name.value)
                    ctx.setResource(deleteResourceID, deleteResolver)
                }
                break;
            default:
            // nothing
        }

    }
}
