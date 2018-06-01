import { Command, command, param, metadata } from 'clime';
import File from '../types/File';
import GraphQLTransform from 'graphql-transform';
import SimpleTransform from 'simple-appsync-transform'
import * as fs from 'fs'
import log from '../log'

const TemplateSchema = `type Post @model {
    id: ID!
    title: String! @search
    tags: [String] @search
    createdAt: String
    updatedAt: String
}
`
const DefaultConfig = (name: string) => `
{
    "name": "${name}"
}
`

@command({
    description: 'Deploy an AppSync API from your schema.graphql file',
})
export default class extends Command {
    @metadata
    public execute() {
        /**
         * Initialize an application.
         */
        log.debug('Creating schema.graphql')
        fs.writeFileSync('schema.graphql', TemplateSchema)
        log.info(`
            Edit the schema.graphql file and then run 'appsync create schema.graphql <application-name>' to build and deploy your API.
        `)
    }
}
