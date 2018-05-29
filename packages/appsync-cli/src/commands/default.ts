import { Command, command, param } from 'clime';
import File from '../types/File';
import GraphQLTransform from 'graphql-transform';
import SimpleTransform from 'simple-appsync-transform'

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
    ) {
        const transformer = new GraphQLTransform({
            transformers: [
                new SimpleTransform()
            ]
        })
        const template = transformer.transform(schemaFile.readSync());
        return JSON.stringify(template, null, 4);
    }
}