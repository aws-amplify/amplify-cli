import AppSync from 'cloudform/types/appSync'
import Template from 'cloudform/types/template'
import Output from 'cloudform/types/output'
import { Fn, StringParameter, Refs } from 'cloudform'
import { ResourceConstants } from 'graphql-transformer-common'
import Resource from "cloudform/types/resource";


export class ResourceFactory {

    public makeParams() {
        return {
            [ResourceConstants.PARAMETERS.AppSyncApiName]: new StringParameter({
                Description: 'The name of the AppSync API',
                Default: 'AppSyncSimpleTransform'
            })
        }
    }

    /**
     * Creates the barebones template for an application.
     */
    public initTemplate(): Template {
        return {
            Parameters: this.makeParams(),
            Resources: {
                [ResourceConstants.RESOURCES.GraphQLAPILogicalID]: this.makeAppSyncAPI(),
                [ResourceConstants.RESOURCES.APIKeyLogicalID]: this.makeAppSyncApiKey()
            },
            Outputs: {
                [ResourceConstants.OUTPUTS.GraphQLAPIIdOutput]: this.makeAPIIDOutput(),
                [ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput]: this.makeAPIEndpointOutput(),
                [ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput]: this.makeApiKeyOutput()
            }
        }
    }

    /**
     * Create the AppSync API.
     */
    public makeAppSyncAPI() {
        return new AppSync.GraphQLApi({
            Name: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiName),
            AuthenticationType: 'API_KEY'
        })
    }

    public makeAppSyncApiKey() {
        return new AppSync.ApiKey({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId')
        })
    }

    /**
     * Outputs
     */
    public makeAPIIDOutput(): Output {
        return {
            Description: "Your GraphQL API ID.",
            Value: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "GraphQLApiId"])
            }
        }
    }

    public makeAPIEndpointOutput(): Output {
        return {
            Description: "Your GraphQL API endpoint.",
            Value: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'GraphQLUrl'),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "GraphQLApiEndpoint"])
            }
        }
    }

    public makeApiKeyOutput(): Output {
        return {
            Description: "Your GraphQL API key. Provide via 'x-api-key' header.",
            Value: Fn.GetAtt(ResourceConstants.RESOURCES.APIKeyLogicalID, 'ApiKey'),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "GraphQLApiKey"])
            }
        }
    }

    public makeResolverS3RootParams(): Template {
        return {
            Parameters: {
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

}