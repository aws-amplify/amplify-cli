import AppSync from 'cloudform-types/types/appSync'
import Template from 'cloudform-types/types/template'
import { Fn, StringParameter } from 'cloudform'
import { ResourceConstants } from 'graphql-transformer-common'
import Resource from "cloudform-types/types/resource";

const RESOLVERS_DIRECTORY_NAME = "resolvers"
const STACKS_DIRECTORY_NAME = "stacks"

export class SchemaResourceUtil {

    public makeResolverS3RootParams(): Template {
        return {
            Parameters: {
                S3DeploymentAssetsURL: new StringParameter({
                    Description: 'The URL to the Amazon S3 bucket containing your deployment assets. For example, s3://bucket/path/to/deployment.' +
                        ' The directory at this path should contain your schema.graphql as well as the "stacks" and "resolvers" directories.'
                })
            }
        }
    }

    public updateResolverResource(resource: Resource) {
        return new AppSync.Resolver({
            ApiId: resource.Properties.ApiId,
            DataSourceName: resource.Properties.DataSourceName,
            FieldName: resource.Properties.FieldName,
            TypeName: resource.Properties.TypeName,
            RequestMappingTemplateS3Location: Fn.Join('', [
                's3://',
                Fn.Join('/', [
                    Fn.Ref('S3DeploymentAssetsURL'),
                    RESOLVERS_DIRECTORY_NAME,
                    Fn.Join('.', [
                        resource.Properties.TypeName,
                        resource.Properties.FieldName,
                        'request',
                        'vtl',
                    ])
                ]),
            ]),
            ResponseMappingTemplateS3Location: Fn.Join('', [
                Fn.Join('/', [
                    Fn.Ref('S3DeploymentAssetsURL'),
                    RESOLVERS_DIRECTORY_NAME,
                    Fn.Join('.', [
                        resource.Properties.TypeName,
                        resource.Properties.FieldName,
                        'response',
                        'vtl'
                    ])
                ]),
            ])
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    public makeAppSyncSchema(schema?: string) {
        if (schema) {
            return new AppSync.GraphQLSchema({
                ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
                Definition: schema
            })
        }
        return new AppSync.GraphQLSchema({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DefinitionS3Location: Fn.Join('/', [
                Fn.Ref('S3DeploymentAssetsURL'),
                'schema.graphql'
            ])
        })
    }
}