import TemplateContext from "./RelationalDBSchemaTransformer";
import { DocumentNode } from 'graphql'
import { Fn } from 'cloudform'
import AppSync from 'cloudform-types/types/appSync'
import { print, obj, set, str, list, forEach, ref, compoundExpression } from 'graphql-mapping-template'
import { graphqlName, toUpper, plurality } from 'graphql-transformer-common'
import { ResourceConstants } from './ResourceConstants'
import RelationalDBMappingTemplate from './RelationalDBMappingTemplate'
import * as fs from 'fs-extra'

const s3BaseUrl = 's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/resolvers/${ResolverFileName}'
const resolverFileName = 'ResolverFileName'
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
    typePrimaryKeyMap: Map<string, string>;
    stringFieldMap: Map<string, string[]>
    intFieldMap: Map<string, string[]>
    resolverFilePath: string

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
    public createRelationalResolvers(resolverFilePath: string) {
        let resources = {}
        this.resolverFilePath = resolverFilePath
        this.typePrimaryKeyMap.forEach((value: string, key: string) => {
            const resourceName = key.replace(/[^A-Za-z0-9]/g, '')
            resources = {
                ...resources,
                ...{[resourceName + 'CreateResolver']: this.makeCreateRelationalResolver(key)},
                ...{[resourceName + 'GetResolver']: this.makeGetRelationalResolver(key)},
                ...{[resourceName + 'UpdateResolver']: this.makeUpdateRelationalResolver(key)},
                ...{[resourceName + 'DeleteResolver']: this.makeDeleteRelationalResolver(key)},
                ...{[resourceName + 'ListResolver']: this.makeListRelationalResolver(key)},
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
        let createSql = `INSERT INTO ${type} $colStr VALUES $valStr`
        let selectSql =
            `SELECT * FROM ${type} WHERE ${this.typePrimaryKeyMap.get(type)}=$ctx.args.create${toUpper(type)}Input.${this.typePrimaryKeyMap.get(type)}`

        const reqFileName = `${mutationTypeName}.${fieldName}.req.vtl`
        const resFileName = `${mutationTypeName}.${fieldName}.res.vtl`

        const reqTemplate = print(
            compoundExpression([
                set(ref('cols'), list([])),
                set(ref('vals'), list([])),
                forEach(
                    ref('entry'),
                    ref(`ctx.args.create${toUpper(type)}Input.keySet()`),
                    [
                        set(ref('discard'), ref(`cols.add($entry)`)),
                        set(ref('discard'), ref(`vals.add("'$ctx.args.create${toUpper(type)}Input[$entry]'")`))
                    ]
                ),
                set(ref('valStr'), ref('vals.toString().replace("[","(").replace("]",")")')),
                set(ref('colStr'), ref('cols.toString().replace("[","(").replace("]",")")')),
                RelationalDBMappingTemplate.rdsQuery({
                    statements: list([str(createSql), str(selectSql)])
                })
            ])
        )

        const resTemplate = print(
            ref('utils.toJson($utils.parseJson($utils.rds.toJsonString($ctx.result))[1][0])')
        )

        fs.writeFileSync(`${this.resolverFilePath}/${reqFileName}`, reqTemplate, 'utf8');
        fs.writeFileSync(`${this.resolverFilePath}/${resFileName}`, resTemplate, 'utf8');

        let resolver = new AppSync.Resolver ({
            ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.RelationalDatabaseDataSource, 'Name'),
            TypeName: mutationTypeName,
            FieldName: fieldName,
            RequestMappingTemplateS3Location: Fn.Sub(
                s3BaseUrl,
                {
                    [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                    [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    [resolverFileName]: reqFileName
                }
            ),
            ResponseMappingTemplateS3Location: Fn.Sub(
                s3BaseUrl,
                {
                    [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                    [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    [resolverFileName]: resFileName
                }
            )
        }).dependsOn([ResourceConstants.RESOURCES.RelationalDatabaseDataSource])
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
        let sql = `SELECT * FROM ${type} WHERE ${this.typePrimaryKeyMap.get(type)}=$ctx.args.${this.typePrimaryKeyMap.get(type)}`
        const reqFileName = `${queryTypeName}.${fieldName}.req.vtl`
        const resFileName = `${queryTypeName}.${fieldName}.res.vtl`

        const reqTemplate = print(
            compoundExpression([
                RelationalDBMappingTemplate.rdsQuery({
                    statements: list([str(sql)])
                })
            ])
        )

        const resTemplate = print(
            ref('utils.toJson($utils.rds.toJsonObject($ctx.result)[0][0])')
        )

        fs.writeFileSync(`${this.resolverFilePath}/${reqFileName}`, reqTemplate, 'utf8');
        fs.writeFileSync(`${this.resolverFilePath}/${resFileName}`, resTemplate, 'utf8');

        let resolver = new AppSync.Resolver ({
            ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.RelationalDatabaseDataSource, 'Name'),
            FieldName: fieldName,
            TypeName: queryTypeName,
            RequestMappingTemplateS3Location: Fn.Sub(
                s3BaseUrl,
                {
                    [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                    [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    [resolverFileName]: reqFileName
                }
            ),
            ResponseMappingTemplateS3Location: Fn.Sub(
                s3BaseUrl,
                {
                    [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                    [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    [resolverFileName]: resFileName
                }
            )
        }).dependsOn([ResourceConstants.RESOURCES.RelationalDatabaseDataSource])
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
            `UPDATE ${type} SET $update WHERE ${this.typePrimaryKeyMap.get(type)}=$ctx.args.update${toUpper(type)}Input.${this.typePrimaryKeyMap.get(type)}`
        const selectSql =
            `SELECT * FROM ${type} WHERE ${this.typePrimaryKeyMap.get(type)}=$ctx.args.update${toUpper(type)}Input.${this.typePrimaryKeyMap.get(type)}`
        const reqFileName = `${mutationTypeName}.${fieldName}.req.vtl`
        const resFileName = `${mutationTypeName}.${fieldName}.res.vtl`

        const reqTemplate = print(
            compoundExpression([
                set(ref('updateList'), obj({})),
                forEach(
                    ref('entry'),
                    ref(`ctx.args.update${toUpper(type)}Input.keySet()`),
                    [
                        set(ref('discard'), ref(`updateList.put($entry, "'$ctx.args.update${toUpper(type)}Input[$entry]'")`))
                    ]
                ),
                set(ref('update'), ref(`updateList.toString().replace("{","").replace("}","")`)),
                RelationalDBMappingTemplate.rdsQuery({
                    statements: list([str(updateSql), str(selectSql)])
                })
            ])
        )

        const resTemplate = print(
            ref('utils.toJson($utils.parseJson($utils.rds.toJsonString($ctx.result))[1][0])')
        )

        fs.writeFileSync(`${this.resolverFilePath}/${reqFileName}`, reqTemplate, 'utf8');
        fs.writeFileSync(`${this.resolverFilePath}/${resFileName}`, resTemplate, 'utf8');

        let resolver =  new AppSync.Resolver ({
            ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.RelationalDatabaseDataSource, 'Name'),
            TypeName: mutationTypeName,
            FieldName: fieldName,
            RequestMappingTemplateS3Location: Fn.Sub(
                s3BaseUrl,
                {
                    [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                    [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    [resolverFileName]: reqFileName
                }
            ),
            ResponseMappingTemplateS3Location: Fn.Sub(
                s3BaseUrl,
                {
                    [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                    [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    [resolverFileName]: resFileName
                }
            )
        }).dependsOn([ResourceConstants.RESOURCES.RelationalDatabaseDataSource])
        return resolver
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
        const selectSql = `SELECT * FROM ${type} WHERE ${this.typePrimaryKeyMap.get(type)}=$ctx.args.${this.typePrimaryKeyMap.get(type)}`
        const deleteSql = `DELETE FROM ${type} WHERE ${this.typePrimaryKeyMap.get(type)}=$ctx.args.${this.typePrimaryKeyMap.get(type)}`
        const reqFileName = `${mutationTypeName}.${fieldName}.req.vtl`
        const resFileName = `${mutationTypeName}.${fieldName}.res.vtl`
        const reqTemplate = print(
            compoundExpression([
                RelationalDBMappingTemplate.rdsQuery({
                    statements: list([str(selectSql), str(deleteSql)])
                })
            ])
        )
        const resTemplate = print(
            ref('utils.toJson($utils.rds.toJsonObject($ctx.result)[0][0])')
        )

        fs.writeFileSync(`${this.resolverFilePath}/${reqFileName}`, reqTemplate, 'utf8');
        fs.writeFileSync(`${this.resolverFilePath}/${resFileName}`, resTemplate, 'utf8');

        let resolver = new AppSync.Resolver ({
            ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.RelationalDatabaseDataSource, 'Name'),
            TypeName: mutationTypeName,
            FieldName: fieldName,
            RequestMappingTemplateS3Location: Fn.Sub(
                s3BaseUrl,
                {
                    [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                    [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    [resolverFileName]: reqFileName
                }
            ),
            ResponseMappingTemplateS3Location: Fn.Sub(
                s3BaseUrl,
                {
                    [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                    [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    [resolverFileName]: resFileName
                }
            )
        }).dependsOn([ResourceConstants.RESOURCES.RelationalDatabaseDataSource])

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
        const reqFileName = `${queryTypeName}.${fieldName}.req.vtl`
        const resFileName = `${queryTypeName}.${fieldName}.res.vtl`
        const reqTemplate = print(
            RelationalDBMappingTemplate.rdsQuery({
                statements: list([str(sql)])
            })
        )
        const resTemplate = print(
            ref('utils.toJson($utils.rds.toJsonObject($ctx.result)[0])')
        )

        fs.writeFileSync(`${this.resolverFilePath}/${reqFileName}`, reqTemplate, 'utf8');
        fs.writeFileSync(`${this.resolverFilePath}/${resFileName}`, resTemplate, 'utf8');

        let resolver = new AppSync.Resolver ({
            ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
            DataSourceName: Fn.GetAtt(ResourceConstants.RESOURCES.RelationalDatabaseDataSource, 'Name'),
            TypeName: queryTypeName,
            FieldName: fieldName,
            RequestMappingTemplateS3Location: Fn.Sub(
                s3BaseUrl,
                {
                    [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                    [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    [resolverFileName]: reqFileName
                }
            ),
            ResponseMappingTemplateS3Location: Fn.Sub(
                s3BaseUrl,
                {
                    [ResourceConstants.PARAMETERS.S3DeploymentBucket]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                    [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    [resolverFileName]: resFileName
                }
            )
        }).dependsOn([ResourceConstants.RESOURCES.RelationalDatabaseDataSource])

        return resolver
    }
}