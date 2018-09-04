import AppSync from 'cloudform/types/appSync'
import Template from 'cloudform/types/template'
import { Fn, StringParameter } from 'cloudform'
import { ResourceConstants, toUpper, ModelResourceIDs } from 'graphql-transformer-common'

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

    /**
     * Create a resolver that creates an item in DynamoDB.
     * @param type
     */
    public makeCustomResolverWithS3(type: string, fieldName: string, fieldTypeName: string) {
        const requestParamName = `${type}.${fieldName}.request`
        const responseParamName = `${type}.${fieldName}.response`
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(fieldTypeName), 'Name'),
            FieldName: fieldName,
            TypeName: type,
            RequestMappingTemplateS3Location: Fn.Ref(this.removeDotsAndCamelcase(requestParamName)),
            ResponseMappingTemplateS3Location: Fn.Ref(this.removeDotsAndCamelcase(responseParamName))
        }).dependsOn(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID)
    }

    public removeDotsAndCamelcase(name: string) {
        return name.split('.').reduce((acc, cur, i) => (acc + (i > 0 ? toUpper(cur) : cur )), "")
        // var nameCopy = name
        // for (var i = 0; i < name.length; i++) {
        //     if (name[i] === '.') {
        //         nameCopy = nameCopy.substr(0, i + 1) + nameCopy.charAt(i + 1).toUpperCase() + nameCopy.slice(i + 2)
        //     }
        // }
        // return nameCopy.replace(/\./g, '')
    }
}