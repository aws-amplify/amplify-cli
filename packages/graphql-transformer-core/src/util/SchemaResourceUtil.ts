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
                [ResourceConstants.PARAMETERS.Env]: new StringParameter({
                    Description: `The environment name. e.g. Dev, Test, or Production`,
                    Default: ResourceConstants.NONE
                }),
                [ResourceConstants.PARAMETERS.S3DeploymentBucket]: new StringParameter({
                    Description: 'The S3 bucket containing all deployment assets for the project.'
                }),
                [ResourceConstants.PARAMETERS.S3DeploymentRootKey]: new StringParameter({
                    Description: 'An S3 key relative to the S3DeploymentBucket that points to the root of the deployment directory.'
                })
            }
        }
    }

    public makeEnvironmentConditions() {
        return {
            [ResourceConstants.CONDITIONS.HasEnvironmentParameter]:
                Fn.Not(Fn.Equals(Fn.Ref(ResourceConstants.PARAMETERS.Env), ResourceConstants.NONE))
        }
    }

    public updateResolverResource(resource: Resource) {
        return new AppSync.Resolver({
            ApiId: resource.Properties.ApiId,
            DataSourceName: resource.Properties.DataSourceName,
            FieldName: resource.Properties.FieldName,
            TypeName: resource.Properties.TypeName,
            RequestMappingTemplateS3Location: Fn.Join('/', [
                's3:/',
                Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                RESOLVERS_DIRECTORY_NAME,
                Fn.Join('.', [
                    resource.Properties.TypeName,
                    resource.Properties.FieldName,
                    'request',
                    'vtl',
                ])
            ]),
            ResponseMappingTemplateS3Location: Fn.Join('/', [
                "s3:/",
                Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                RESOLVERS_DIRECTORY_NAME,
                Fn.Join('.', [
                    resource.Properties.TypeName,
                    resource.Properties.FieldName,
                    'response',
                    'vtl'
                ])
            ])
        })
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
                "s3:/",
                Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                'schema.graphql'
            ])
        })
    }
}