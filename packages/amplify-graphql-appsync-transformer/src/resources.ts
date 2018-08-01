import AppSync from 'cloudform/types/appSync'
import Template from 'cloudform/types/template'

import { Fn, StringParameter } from 'cloudform'
import { ResourceConstants } from 'amplify-graphql-transformer-common'
import Resource from "../../amplify-graphql-transform/node_modules/cloudform/types/resource";


export class ResourceFactory {

    public makeResolverParam(name: string): Template {
        return {
            Parameters: {
                [this.removeDotsAndCamelcase(name)]: new StringParameter({
                    Description: `The S3 location for the Resolver: ${name}`,
                })
            }
        }
    }

    public updateResolverResource(resource: Resource, requestParamName: string, responseParamName: string) {
        return new AppSync.Resolver({
            ApiId: resource.Properties.ApiId,
            DataSourceName: resource.Properties.DataSourceName,
            FieldName: resource.Properties.FieldName,
            TypeName: resource.Properties.TypeName,
            RequestMappingTemplateS3Location: Fn.Ref(this.removeDotsAndCamelcase(requestParamName)),
            ResponseMappingTemplateS3Location: Fn.Ref(this.removeDotsAndCamelcase(responseParamName))
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
            if (name[i] == '.') {
                nameCopy = nameCopy.substr(0, i + 1) + nameCopy.charAt(i + 1).toUpperCase() + nameCopy.slice(i + 2)
            }
        }
        return nameCopy.replace(/\./g, '')
    }

}