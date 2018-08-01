import { Command, command, param } from 'clime';

@command({
    description: 'Deploy an AppSync API from your schema.graphql file',
})
export default class extends Command {
    public execute(
        @param({
            description: 'Your name',
            required: true,
        })
        name: string,
    ) {
        return `Hello, ${name}!`;
    }
}