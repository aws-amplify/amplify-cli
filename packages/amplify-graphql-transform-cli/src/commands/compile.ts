import { Command, command, param } from 'clime';
import File from '../types/File';
import GraphQLTransform from 'amplify-graphql-transform';
import DynamoDBTransformer from 'amplify-graphql-dynamodb-transformer'
import { AppSyncSearchableTransformer } from 'amplify-graphql-elasticsearch-transformer'

@command({
    description: 'Deploy an AppSync API from your schema.graphql file',
})
export default class extends Command {
    public execute(
        @param({
            description: 'Path to schema.graphql',
            required: true,
        })
        schemaFile: File,
        @param({
            description: 'Path to output.yaml',
            required: true,
        })
        output: File
    ) {
        const transformer = new GraphQLTransform({
            transformers: [
                new DynamoDBTransformer(),
                new AppSyncSearchableTransformer()
            ]
        })
        const cfdoc = transformer.transform(schemaFile.readSync());
        output.writeSync(JSON.stringify(cfdoc, null, 4));
    }
}
