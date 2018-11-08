import AppSync from 'cloudform/types/appSync'
import Template from 'cloudform/types/template'

import { Fn, StringParameter } from 'cloudform'
import { ResourceConstants, NONE_VALUE } from 'graphql-transformer-common'
import Resource from "cloudform/types/resource";


export class ResourceFactory {

    public makeResolverS3RootParams(): Template {
        return {
            Parameters: {
                [ResourceConstants.PARAMETERS.Env]: new StringParameter({
                    Description: `The environment name. e.g. Dev, Test, or Production`,
                    Default: ResourceConstants.NONE
                }),
                ResolverBucket: new StringParameter({
                    Description: `The name of the bucket containing the resolver templates`,
                }),
                ResolverRootKey: new StringParameter({
                    Description: `The s3 key of the folder containing the resolver templates in format {Type}.{Field}.[response|request].{Timestamp}`,
                }),
                DeploymentTimestamp: new StringParameter({
                    Description: `The timestamp used to identify thie most recent version of the resolver templates in s3.`,
                })
            }
        }
    }

    public makeResolverParam(name: string): Template {
        return {
            Parameters: {
                [this.removeDotsAndCamelcase(name)]: new StringParameter({
                    Description: `The S3 location for the Resolver: ${name}`,
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
                    Fn.Ref('ResolverBucket'),
                    Fn.Ref('ResolverRootKey'),
                    Fn.Join('.', [
                        resource.Properties.TypeName,
                        resource.Properties.FieldName,
                        'request',
                        Fn.Ref('DeploymentTimestamp')
                    ])
                ]),
            ]),
            ResponseMappingTemplateS3Location: Fn.Join('', [
                's3://',
                Fn.Join('/', [
                    Fn.Ref('ResolverBucket'),
                    Fn.Ref('ResolverRootKey'),
                    Fn.Join('.', [
                        resource.Properties.TypeName,
                        resource.Properties.FieldName,
                        'response',
                        Fn.Ref('DeploymentTimestamp')
                    ])
                ]),
            ])
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    public makeSchemaParam(): Template {
        return {
            Parameters: {
                [this.removeDotsAndCamelcase('schema.graphql')]: new StringParameter({
                    Description: `The S3 location for the Schema: schema.graphql`,
                })
            }
        }
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
            DefinitionS3Location: Fn.Ref(this.removeDotsAndCamelcase('schema.graphql'))
        })
    }

    public removeDotsAndCamelcase(name: string) {
        var nameCopy = name
        for (var i = 0; i < name.length; i++) {
            if (name[i] === '.') {
                nameCopy = nameCopy.substr(0, i + 1) + nameCopy.charAt(i + 1).toUpperCase() + nameCopy.slice(i + 2)
            }
        }
        return nameCopy.replace(/\./g, '')
    }

    public makeEnvironmentConditions() {
        return {
            [ResourceConstants.CONDITIONS.HasEnvironmentParameter]:
                Fn.Not(Fn.Equals(Fn.Ref(ResourceConstants.PARAMETERS.Env), ResourceConstants.NONE))
        }
    }

}