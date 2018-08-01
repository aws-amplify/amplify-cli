import { Command, command, param } from 'clime';
import log from '../log'
import { CloudFormation } from 'aws-sdk'

async function deleteStack(name: string, region: string) {
    const cloudformation = new CloudFormation({ apiVersion: '2010-05-15', region });
    // const paramOverrides = Object.keys(params).map((k: string) => `${k}=${params[k]}`).join(' ')
    return await new Promise((resolve, reject) => {
        cloudformation.deleteStack({
            StackName: name
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
        const out = await deleteStack(name, region)
        return 'Application deleted successfully.'
    }
}
