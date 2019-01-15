import TemplateContext from "./RelationalDBSchemaTransformer";
import { DocumentNode } from 'graphql'
import { Fn } from 'cloudform'
import AppSync from 'cloudform-types/types/appSync'
import { print, obj, set, str, list, forEach, ref, compoundExpression } from 'graphql-mapping-template'
import { ResourceConstants, graphqlName, toUpper, plurality } from 'graphql-transformer-common'
import RelationalDBMappingTemplate from './RelationalDBMappingTemplate'

/**
 * This Class is responsible for Generating the RDS Resolvers based on the
 * GraphQL Schema + Metadata of the RDS Cluster (i.e. Primary Keys for Tables).
 *
 * It will generate the CRUDL+Q (Create, Retrieve, Update, Delete, List + Queries) Resolvers as
 * Cloudform Resources so that they may be added on to the base template that the
 * RelationDBTemplateGenerator creates.
 */
export default class RelationalDBResolverGenerator {
    document: DocumentNode
    typePrimaryKeyMap = {};
    stringFieldMap: Map<string, string[]>
    intFieldMap: Map<string, string[]>


    constructor(context: TemplateContext) {
        this.document = context.schemaDoc
        this.typePrimaryKeyMap = context.typePrimaryKeyMap
        this.stringFieldMap = context.stringFieldMap
        this.intFieldMap = context.intFieldMap
    }

    /**
     * Creates the CRUDL+Q Resolvers as a Map of Cloudform Resources. The output can then be
     * merged with an existing Template's map of Resources.
     */
    public createRelationalResolvers() {
        let resources: { [key: string]: any } = {}
        Object.keys(this.typePrimaryKeyMap).forEach(element => {
            resources = {
                ...resources,
                ...{[element + 'CreateResolver']: this.makeCreateRelationalResolver(element)},
                ...{[element + 'GetResolver']: this.makeGetRelationalResolver(element)},
                ...{[element + 'UpdateResolver']: this.makeUpdateRelationalResolver(element)},
                ...{[element + 'DeleteResolver']: this.makeDeleteRelationalResolver(element)},
                ...{[element + 'ListResolver']: this.makeListRelationalResolver(element)},
            }
            // TODO: Add Guesstimate Query Resolvers
        })

        return resources
    }

    /**
     * Private Helpers to Generate the CFN Spec for the Resolver Resources
     */

    /**
     * Creates and returns the CFN Spec for the 'Create' Resolver Resource provided
     * a GraphQL Type as the input
     *
     * @param type - the graphql type for which the create resolver will be created
     * @param mutationTypeName - will be 'Mutation'
     */
    private makeCreateRelationalResolver(type: string, mutationTypeName: string = 'Mutation') {
        const fieldName = graphqlName('create' + toUpper(type))
        let sql = `INSERT INTO ${type} $colStr VALUES $valStr`

        let resolver = new AppSync.Resolver ({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt('RDSDataSource', 'Name'),
            TypeName: mutationTypeName,
            FieldName: fieldName,
            RequestMappingTemplate: print(
                compoundExpression([
                    set(ref('cols'), list([])),
                    set(ref('vals'), list([])),
                    forEach(
                        ref('entry'),
                        ref(`$ctx.args.create${toUpper(type)}Input.keySet()`),
                        [
                            set(ref('discard'), ref(`$cols.add($entry)`)),
                            set(ref('discard'), ref(`vals.add($entry, "$ctx.args.create${toUpper(type)}Input[$entry]")`))
                        ]
                    ),
                    set(ref('valStr'), ref('vals.toString().replace("[","(").replace("]",")"')),
                    set(ref('colStr'), ref('cols.toString().replace("[","(").replace("]",")"')),
                    RelationalDBMappingTemplate.rdsQuery({
                        statements: list([str(sql)])
                    })
                ])
            ),
            ResponseMappingTemplate: print(
                ref('$utils.toJson($utils.rds.toJsonObject($ctx.result)[0])')
            )
        })
        return resolver
    }

    /**
     * Creates and Returns the CFN Spec for the 'Get' Resolver Resource provided
     * a GraphQL type
     *
     * @param type - the graphql type for which the get resolver will be created
     * @param queryTypeName  - will be 'Query'
     */
    private makeGetRelationalResolver(type: string, queryTypeName: string = 'Query') {
        const fieldName = graphqlName('get' + toUpper(type))
        const sql = `SELECT * FROM ${type} WHERE ${this.typePrimaryKeyMap[type]}=$ctx.args.${this.typePrimaryKeyMap[type]}`

        let resolver = new AppSync.Resolver ({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt('RDSDataSource', 'Name'),
            FieldName: fieldName,
            TypeName: queryTypeName,
            RequestMappingTemplate: print(
                compoundExpression([
                    RelationalDBMappingTemplate.rdsQuery({
                        statements: list([str(sql)])
                    })
                ])
            ),
            ResponseMappingTemplate: print(
                ref('$utils.toJson($utils.rds.toJsonObject($ctx.result)[0][0])')
            )
        })

        return resolver
    }

    /**
     * Creates and Returns the CFN Spec for the 'Update' Resolver Resource provided
     * a GraphQL type
     *
     * @param type - the graphql type for which the update resolver will be created
     * @param mutationTypeName - will be 'Mutation'
     */
    private makeUpdateRelationalResolver(type: string, mutationTypeName: string = 'Mutation') {
        const fieldName = graphqlName('update' + toUpper(type))
        const updateSql =
            `UPDATE ${type} SET $update WHERE ${this.typePrimaryKeyMap[type]}=$ctx.args.update${toUpper(type)}Input.${this.typePrimaryKeyMap[type]}`
        const selectSql =
            `SELECT * FROM ${type} WHERE ${this.typePrimaryKeyMap[type]}=$ctx.args.update${toUpper(type)}Input.${this.typePrimaryKeyMap[type]}`

        return new AppSync.Resolver ({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt('RDSDataSource', 'Name'),
            TypeName: mutationTypeName,
            FieldName: fieldName,
            RequestMappingTemplate: print(
                compoundExpression([
                    set(ref('updateList'), obj({})),
                    forEach(
                        ref('entry'),
                        ref(`$ctx.args.update${toUpper(type)}Input.keySet()`),
                        [
                            set(ref('discard'), ref(`updateList.put($entry, "$ctx.args.update${toUpper(type)}Input[$entry]")`))
                        ]
                    ),
                    set(ref('update'), ref(`updateList.toString().replace("{","").replace("}","")`)),
                    RelationalDBMappingTemplate.rdsQuery({
                        statements: list([str(updateSql), str(selectSql)])
                    })
                ])
            ),
            ResponseMappingTemplate: print(
                ref('$utils.toJson($utils.rds.toJsonObject($ctx.result)[1][0])')
            )
        })
    }

    /**
     * Creates and Returns the CFN Spec for the 'Delete' Resolver Resource provided
     * a GraphQL type
     *
     * @param type - the graphql type for which the delete resolver will be created
     * @param mutationTypeName - will be 'Mutation'
     */
    private makeDeleteRelationalResolver(type: string, mutationTypeName: string = 'Mutation') {
        const fieldName = graphqlName('delete' + toUpper(type))
        const selectSql = `SELECT * FROM ${type} WHERE ${this.typePrimaryKeyMap[type]}=$ctx.args.${this.typePrimaryKeyMap[type]}`
        const deleteSql = `DELETE FROM ${type} WHERE ${this.typePrimaryKeyMap[type]}=$ctx.args.${this.typePrimaryKeyMap[type]}`

        let resolver = new AppSync.Resolver ({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt('RDSDataSource', 'Name'),
            TypeName: mutationTypeName,
            FieldName: fieldName,
            RequestMappingTemplate: print(
                compoundExpression([
                    RelationalDBMappingTemplate.rdsQuery({
                        statements: list([str(selectSql), str(deleteSql)])
                    })
                ])
            ),
            ResponseMappingTemplate: print(
                ref('$utils.toJson($utils.rds.toJsonObject($ctx.result)[0][0])')
            )
        })

        return resolver
    }

    /**
     * Creates and Returns the CFN Spec for the 'List' Resolver Resource provided
     * a GraphQL type
     *
     * @param type - the graphql type for which the list resolver will be created
     * @param queryTypeName - will be 'Query'
     */
    private makeListRelationalResolver(type: string, queryTypeName: string = 'Query') {
        const fieldName = graphqlName('list' + plurality(toUpper(type)))
        const sql = `SELECT * FROM ${type}`

        let resolver = new AppSync.Resolver ({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt('RDSDataSource', 'Name'),
            TypeName: queryTypeName,
            FieldName: fieldName,
            RequestMappingTemplate: print(
                RelationalDBMappingTemplate.rdsQuery({
                    statements: list([str(sql)])
                })
            ),
            ResponseMappingTemplate: print(
                ref('$utils.toJson($utils.rds.toJsonObject($ctx.result)[0])')
            )
        })

        return resolver
    }
}