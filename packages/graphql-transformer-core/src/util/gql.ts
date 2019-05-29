import { parse } from 'graphql';
export function gql(literals: TemplateStringsArray, ...placeholders: string[]) {
    const interleaved = [];
    for (let i = 0; i < placeholders.length; i++) {
        interleaved.push(literals[i]);
        interleaved.push(placeholders[i]);
    }
    interleaved.push(literals[literals.length - 1]);
    const actualSchema = interleaved.join('');
    return parse(actualSchema);
}