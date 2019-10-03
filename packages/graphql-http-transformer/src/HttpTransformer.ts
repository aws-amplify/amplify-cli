import { Transformer, TransformerContext, TransformerContractError, gql } from 'graphql-transformer-core'
import {
    DirectiveNode, ObjectTypeDefinitionNode,
    Kind, FieldDefinitionNode, InterfaceTypeDefinitionNode,
    InputValueDefinitionNode, print
} from 'graphql'
import { ResourceFactory } from './resources'
import {
    getDirectiveArgument, isScalar
} from 'graphql-transformer-common'
import { ResolverResourceIDs, HttpResourceIDs } from 'graphql-transformer-common'
import {
    makeUrlParamInputObject,
    makeHttpArgument,
    makeHttpQueryInputObject,
    makeHttpBodyInputObject
} from './definitions';

const HTTP_STACK_NAME = 'HttpStack'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface HttpHeader {
    key: String,
    value: String
}

interface HttpDirectiveArgs {
    method?: HttpMethod,
    url: String,
    headers: HttpHeader[]
}

/**
 * The @http transform.
 *
 * This transform attaches http resolvers to any fields with the @http directive.
 * Works with GET, POST, PUT, DELETE requests.
 */
export class HttpTransformer extends Transformer {

    resources: ResourceFactory

    static urlRegex = /(http(s)?:\/\/)|(\/.*)/g

    constructor() {
        super(
            'HttpTransformer',
            gql`
            directive @http(
                method: HttpMethod = GET,
                url: String!,
                headers: [HttpHeader] = []
            ) on FIELD_DEFINITION
            enum HttpMethod {
                GET
                POST
                PUT
                DELETE
                PATCH
            }
            input HttpHeader {
                key: String,
                value: String
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
                throw new TransformerContractError(`@http directive at location ${value.loc.start} ` +
                    `requires a url parameter that begins with http:// or https://.`)
            }
            // extract just the base url with protocol
            const baseURL = url.replace(HttpTransformer.urlRegex, '$1')
            const dataSourceID = HttpResourceIDs.HttpDataSourceID(baseURL)
            // only create one DataSource per base URL
            if (!ctx.getResource(dataSourceID)) {
                ctx.mapResourceToStack(HTTP_STACK_NAME, dataSourceID)
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
        ctx.mapResourceToStack(
            HTTP_STACK_NAME,
            ResolverResourceIDs.ResolverResourceID(parent.name.value, field.name.value)
        )
        const url: string = getDirectiveArgument(directive)("url")
        const baseURL: string = url.replace(HttpTransformer.urlRegex, '$1')
        // split the url into pieces, and get the path part off the end
        let path: string = url.split(/(http(s)?:\/\/|www\.)|(\/.*)/g).slice(-2, -1)[0]

        // extract any URL parameters from the path
        let urlParams: string[] = path.match(/:\w+/g)
        let queryBodyArgsArray: InputValueDefinitionNode[] = field.arguments as InputValueDefinitionNode[]
        let newFieldArgsArray: InputValueDefinitionNode[] = []

        if (urlParams) {
            urlParams = urlParams.map((p) => p.replace(':', ''))

            // if there are URL parameters, remove them from the array we'll use
            // to create the query and body types
            queryBodyArgsArray = field.arguments
                .filter((e) => (
                    isScalar(e.type) &&
                    !urlParams.includes(e.name.value))
                )

            // replace each URL parameter with $ctx.args.params.parameter_name for use in resolver template
            path = path.replace(/:\w+/g, (str: string) => {
                return `\$\{ctx.args.params.${str.replace(':', '')}\}`
            })

            const urlParamInputObject = makeUrlParamInputObject(parent, field, urlParams)
            ctx.addInput(urlParamInputObject)

            newFieldArgsArray.push(makeHttpArgument('params', urlParamInputObject, true))
        }

        let method: HttpMethod = getDirectiveArgument(directive)("method")
        if (!method) {
            method = 'GET'
        }

        let headers : HttpHeader[] = getDirectiveArgument(directive)("headers")

        if (!headers || !Array.isArray(headers)) {
            headers = [];
        }

        if (queryBodyArgsArray.length > 0) {
            // for GET requests, leave the nullability of the query parameters unchanged -
            // but for PUT, POST and PATCH, unwrap any non-nulls
            const queryInputObject = makeHttpQueryInputObject(
                parent,
                field,
                queryBodyArgsArray,
                method === 'GET' ? false : true
            )
            const bodyInputObject = makeHttpBodyInputObject(
                parent,
                field,
                queryBodyArgsArray,
                true
            )

            // if any of the arguments for the query are non-null,
            // make the newly generated type wrapper non-null too (only really applies for GET requests)
            const makeNonNull = queryInputObject.fields
                .filter(a => a.type.kind === Kind.NON_NULL_TYPE).length > 0 ? true : false

            ctx.addInput(queryInputObject)
            newFieldArgsArray.push(makeHttpArgument('query', queryInputObject, makeNonNull))

            if (method !== 'GET' && method !== 'DELETE') {
                ctx.addInput(bodyInputObject)
                newFieldArgsArray.push(makeHttpArgument('body', bodyInputObject, makeNonNull))
            }
        }

        // build the payload
        switch (method) {
            case 'GET':
                const getResourceID = ResolverResourceIDs.ResolverResourceID(parent.name.value, field.name.value)
                if (!ctx.getResource(getResourceID)) {
                    const getResolver = this.resources.makeGetResolver(
                        baseURL,
                        path,
                        parent.name.value,
                        field.name.value,
                        headers
                    )
                    ctx.setResource(getResourceID, getResolver)
                }
                break;
            case 'POST':
                const postResourceID = ResolverResourceIDs.ResolverResourceID(parent.name.value, field.name.value)
                if (!ctx.getResource(postResourceID)) {
                    const postResolver = this.resources.makePostResolver(
                        baseURL,
                        path,
                        parent.name.value,
                        field.name.value,
                        queryBodyArgsArray
                            .filter(a => a.type.kind === Kind.NON_NULL_TYPE)
                            .map(a => a.name.value),
                        headers
                    )
                    ctx.setResource(postResourceID, postResolver)
                }
                break;
            case 'PUT':
                const putResourceID = ResolverResourceIDs.ResolverResourceID(parent.name.value, field.name.value)
                if (!ctx.getResource(putResourceID)) {
                    const putResolver = this.resources.makePutResolver(
                        baseURL,
                        path,
                        parent.name.value,
                        field.name.value,
                        queryBodyArgsArray
                            .filter(a => a.type.kind === Kind.NON_NULL_TYPE)
                            .map(a => a.name.value),
                        headers
                    )
                    ctx.setResource(putResourceID, putResolver)
                }
                break;
            case 'DELETE':
                const deleteResourceID = ResolverResourceIDs.ResolverResourceID(parent.name.value, field.name.value)
                if (!ctx.getResource(deleteResourceID)) {
                    const deleteResolver = this.resources.makeDeleteResolver(baseURL, path, parent.name.value, field.name.value, headers)
                    ctx.setResource(deleteResourceID, deleteResolver)
                }
                break;
            case 'PATCH':
                const patchResourceID = ResolverResourceIDs.ResolverResourceID(parent.name.value, field.name.value)
                if (!ctx.getResource(patchResourceID)) {
                    const patchResolver = this.resources.makePatchResolver(
                        baseURL,
                        path,
                        parent.name.value,
                        field.name.value,
                        queryBodyArgsArray
                            .filter(a => a.type.kind === Kind.NON_NULL_TYPE)
                            .map(a => a.name.value),
                        headers
                    )
                    ctx.setResource(patchResourceID, patchResolver)
                }
                break;
            default:
            // nothing
        }

        // now update the field if necessary with the new arguments
        if (newFieldArgsArray.length > 0) {
            const updatedField = {
                ...field,
                arguments: newFieldArgsArray
            }

            const mostRecentParent = ctx.getType(parent.name.value) as ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode
            let updatedFieldsInParent = mostRecentParent.fields.filter(f => f.name.value !== field.name.value)
            updatedFieldsInParent.push(updatedField)

            const updatedParentType = {
                ...mostRecentParent,
                fields: updatedFieldsInParent
            }

            ctx.putType(updatedParentType)
        }
    }
}
