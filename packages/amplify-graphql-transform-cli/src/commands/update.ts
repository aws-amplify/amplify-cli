import { Command, command, param } from 'clime';
import File from '../types/File';
import GraphQLTransform from 'amplify-graphql-transform';
import DynamoDBTransformer from 'amplify-graphql-dynamodb-transformer'
import { AppSyncSearchableTransformer } from 'amplify-graphql-elasticsearch-transformer'
import log from '../log'
import { CloudFormation } from 'aws-sdk'
import { ResourceConstants } from 'amplify-graphql-transformer-common'

async function updateStack(template: any, name: string, region: string) {
    const cloudformation = new CloudFormation({ apiVersion: '2010-05-15', region });
    const params = [
        {
            ParameterKey: ResourceConstants.PARAMETERS.AppSyncApiName,
            UsePreviousValue: true
        },
        {
            ParameterKey: ResourceConstants.PARAMETERS.DynamoDBModelTableName,
            UsePreviousValue: true
        },
        {
            ParameterKey: ResourceConstants.PARAMETERS.ElasticSearchDomainName,
            UsePreviousValue: true
        },
        {
            ParameterKey: ResourceConstants.PARAMETERS.ElasticSearchAccessIAMRoleName,
            UsePreviousValue: true
        },
        {
            ParameterKey: ResourceConstants.PARAMETERS.ElasticSearchStreamingIAMRoleName,
            UsePreviousValue: true
        }
    ]
    // const paramOverrides = Object.keys(params).map((k: string) => `${k}=${params[k]}`).join(' ')
    return await new Promise((resolve, reject) => {
        cloudformation.updateStack({
            StackName: name,
            Capabilities: ['CAPABILITY_NAMED_IAM'],
            Parameters: params,
            TemplateBody: JSON.stringify(template)
        }, (err: Error, data: any) => {
            if (err) {
                log.error(err.message)
                reject(err)
                return
            }
            resolve(data)
        })
    })
}

@command({
    description: 'Deploy an AppSync API from your schema.graphql file',
})
export default class extends Command {
    public async execute(
        @param({
            description: 'Path to schema.graphql',
            required: true,
        })
        schema: File,
        @param({
            description: 'The name of the application',
            required: true,
        })
        name: string,
        @param({
            description: 'The region to launch the stack in. Defaults to us-west-2',
            required: false,
            default: 'us-west-2'
        })
        region: string
    ) {
        const transformer = new GraphQLTransform({
            transformers: [
                new DynamoDBTransformer(),
                new AppSyncSearchableTransformer()
            ]
        })
        const cfdoc = transformer.transform(schema.readSync());
        const out = await updateStack(cfdoc, name, region)
        return 'Application update successfully started. It may take a few minutes to finish.'
    }
}
