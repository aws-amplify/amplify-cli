import { Command, command, param } from 'clime';
import File from '../types/File';
import GraphQLTransform from 'graphql-transform';
import DynamoDBTransformer from 'appsync-dynamodb-transformer'
import ElasticSearchTransformer from 'appsync-elasticsearch-transformer'
import AuthTransformer from 'appsync-auth-transformer'
import log from '../log'
import { CloudFormation } from 'aws-sdk'
import { ResourceConstants } from 'appsync-transformer-common'

async function createStack(template: any, name: string, region: string) {
    const cloudformation = new CloudFormation({ apiVersion: '2010-05-15', region });
    const params = [
        {
            ParameterKey: ResourceConstants.PARAMETERS.AppSyncApiName,
            ParameterValue: name
        },
        {
            ParameterKey: ResourceConstants.PARAMETERS.DynamoDBModelTableName,
            ParameterValue: name + 'Table'
        },
        // {
        //     ParameterKey: 'ElasticSearchDomainName',
        //     ParameterValue: name.toLowerCase()
        // },
        // {
        //     ParameterKey: 'IAMRoleName',
        //     ParameterValue: name + 'Role'
        // },
        // {
        //     ParameterKey: 'StreamingIAMRoleName',
        //     ParameterValue: name + 'StreamingLambda'
        // }
    ]
    // const paramOverrides = Object.keys(params).map((k: string) => `${k}=${params[k]}`).join(' ')
    return await new Promise((resolve, reject) => {
        cloudformation.createStack({
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
                // new ElasticSearchTransformer(),
                new AuthTransformer()
            ]
        })
        const cfdoc = transformer.transform(schema.readSync());
        const out = await createStack(cfdoc, name, region)
        return 'Application creation successfully started. It may take a few minutes to finish.'
    }
}
