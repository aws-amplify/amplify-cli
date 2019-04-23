import { parse } from 'graphql';
export function gql(literals: TemplateStringsArray, ...placeholders: string[]) {
    const interleaved = [];
    for (let i = 0; i < placeholders.length; i++) {
        interleaved.push(literals[i]);
        interleaved.push(placeholders[i]);
    }
    interleaved.push(literals.length - 1);
    return parse(interleaved.join(''));
}