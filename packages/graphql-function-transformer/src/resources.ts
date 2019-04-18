import { AppSync, Fn, IAM } from 'cloudform-types'
import { ResourceConstants } from 'graphql-transformer-common'
import { toUpper } from 'graphql-transformer-common'

export class ResourceFactory {

    public makeLambdaDataSource(lambdaName: string, iamRoleLogicalID: string) {
        // strip ${env} and capitalize
        let baseName = toUpper(lambdaName.replace(/-?_?\${[^}]*}/g, ''))

        return new AppSync.DataSource({
            ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
            Name: baseName,
            //TODO: later use ResourceConstants.DataSourceTypeLambda
            Type: 'AWS_LAMBDA',
            ServiceRoleArn: Fn.GetAtt(iamRoleLogicalID, 'Arn'),
            LambdaConfig: {
                LambdaFunctionArn: Fn.Sub(
                    'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:' + lambdaName,
                    { env: { Ref: 'env' }}
                )
            }
        }).dependsOn([iamRoleLogicalID])
    }

    /**
     * Create a single role that allows AppSync to invoke lambda function
     * @param lambdaName name of lambda function that AppSync can invoke
     * @param roleName The name of the IAM role to create.
     */
    public makeInvokeLambdaIAMRole(lambdaName: string, roleName: string){
        return new IAM.Role({
            RoleName: Fn.Sub(
                roleName,
                { env: { Ref: 'env'}}
            ),
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'appsync.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole'
                    }
                ]   
            },
            Policies: [
                new IAM.Role.Policy({
                    PolicyName: 'InvokeLambdaFunction',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: ['lambda:invokeFunction'],
                                Resource: [
                                    Fn.Sub(
                                        'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:' + lambdaName,
                                        { env: { Ref: 'env' }}
                                    )
                                ]
                            }
                        ]
                    }
                })
            ]
        })
    }

    public makeResolver(lambdaDataSourceID: string, type: string, field: string){
        return new AppSync.Resolver({
            ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
            DataSourceName: Fn.GetAtt(lambdaDataSourceID, 'Name'),
            TypeName: type,
            FieldName: field,
            RequestMappingTemplateS3Location: Fn.Sub(
                's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/resolvers/' + `${type}.${field}.res.vtl`,
                { 
                    S3DeploymentBucket: { Ref: 'S3DeploymentBucket' },
                    S3DeploymentRootKey: { Ref: 'S3DeploymentRootKey' }
                }
            )
        })
    }
}