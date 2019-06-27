import { TransformFormatter } from '../TransformFormatter'
import { Template, Fn, AppSync, DynamoDB } from 'cloudform-types';
import { TransformerContext } from '..';

const template: Template = {
    Parameters: {
        IsProd: {
            Type: "String",
            Default: "prod"
        }
    },
    Conditions: {
        IsProd: Fn.Equals(Fn.Ref("env"), "prod")
    },
    Resources: {
        API: new AppSync.GraphQLApi({
            Name: "My AppSync API",
            AuthenticationType: "API_KEY"
        }),
        PostTableDataSource: new AppSync.DataSource({
            ApiId: Fn.Ref("API"),
            Name: "PostDataSource",
            Type: "AMAZON_DYNAMODB"
        }),
        PostTable: new DynamoDB.Table({
            KeySchema: [{
                AttributeName: "id",
                KeyType: "HASH"
            }],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }),
        CreatePostResolver: new AppSync.Resolver({
            ApiId: Fn.Ref("API"),
            DataSourceName: Fn.GetAtt("PostTableDataSource", "name"),
            FieldName: "createPost",
            TypeName: "Mutation"
        }),
        UpdatePostResolver: new AppSync.Resolver({
            ApiId: Fn.Ref("API"),
            DataSourceName: Fn.Join(":", [
                Fn.Ref("PostTable"),
                Fn.Join(":", [
                    Fn.GetAtt("PostTableDataSource", "name")
                ])
            ]),
            // Contrived examples for test coverage.
            FieldName: Fn.Split(":", Fn.Ref("PostTable")),
            TypeName: Fn.Sub("${t}", {
                t: Fn.Ref("PostTable")
            }),
            RequestMappingTemplate: Fn.Select(0, [
                Fn.Ref("PostTable")
            ])
        })
    },
    Outputs: {
        PostTableOutput: {
            Description: "PostTable Arn.",
            Value: Fn.GetAtt("PostTable", 'Arn')
        }
    }
}


test('Test getTemplateReferences', () => {
    const formatter = new TransformFormatter();
    const context = new TransformerContext('type Post @model { id: ID! title: String }')
    context.mapResourceToStack('PostModel', 'CreatePostResolver');
    context.mapResourceToStack('PostModel', 'UpdatePostResolver');
    context.mapResourceToStack('PostModel', 'PostTableDataSource');
    context.mapResourceToStack('PostModel', 'PostTable');
    context.mapResourceToStack('PostModel', 'PostTableOutput');
    context.template = template;
    const deploymentResources = formatter.format(context)
    expect(Object.keys(deploymentResources.stacks.PostModel.Resources)).toHaveLength(4)
    expect(Object.keys(deploymentResources.rootStack.Resources)).toHaveLength(3)
    expect(Object.keys(deploymentResources.stacks.PostModel.Outputs)).toHaveLength(1);
    expect(Object.keys(deploymentResources.rootStack.Outputs)).toHaveLength(0);
});