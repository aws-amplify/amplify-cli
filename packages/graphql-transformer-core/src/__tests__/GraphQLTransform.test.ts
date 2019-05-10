import {
    ObjectTypeDefinitionNode, DirectiveNode, parse
} from 'graphql'
import GraphQLTransform from '../GraphQLTransform'
import TransformerContext from '../TransformerContext'
import Transformer from '../Transformer'
import { getDirectiveArguments, gql } from '../util'

class ValidObjectTransformer extends Transformer {
    constructor() {
        super(
            'ValidObjectTransformer', gql`directive @ObjectDirective on OBJECT`)
    }

    public object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => {
        return
    }
}

class InvalidObjectTransformer extends Transformer {
    constructor() {
        super('InvalidObjectTransformer', gql`directive @ObjectDirective on OBJECT`)
    }
}

test('Test graphql transformer validation happy case', () => {
    const validSchema = `type Post @ObjectDirective { id: ID! }`
    const transformer = new GraphQLTransform({
        transformers: [
            new ValidObjectTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
});

test('Test graphql transformer validation. Transformer does not implement required method.', () => {
    const validSchema = `type Post @ObjectDirective { id: ID! }`
    const transformer = new GraphQLTransform({
        transformers: [
            new InvalidObjectTransformer()
        ]
    })
    try {
        transformer.transform(validSchema);
    } catch (e) {
        expect(e.name).toEqual('InvalidTransformerError')
    }
});

test('Test graphql transformer validation. Unknown directive.', () => {
    const invalidSchema = `type Post @UnknownDirective { id: ID! }`
    const transformer = new GraphQLTransform({
        transformers: [
            new InvalidObjectTransformer()
        ]
    })
    try {
        transformer.transform(invalidSchema);
    } catch (e) {
        expect(e.name).toEqual('SchemaValidationError')
    }
});

class PingTransformer extends Transformer {
    constructor() {
        super(
            'ValidObjectTransformer',
            gql`
            directive @ping(config: PingConfig) on OBJECT
            input PingConfig {
                url: String!
            }
            `)
    }

    public object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => {
        return
    }
}

test('Test graphql transformer validation on bad shapes. @ping directive.', () => {
    const invalidSchema = `type Post @ping(config: { bad: "shape" }) { id: ID! }`
    const transformer = new GraphQLTransform({
        transformers: [
            new PingTransformer()
        ]
    })
    try {
        console.log(`Transforming: \n${invalidSchema}`)
        const out = transformer.transform(invalidSchema);
        expect(true).toEqual(false)
    } catch (e) {
        console.log(e.message)
        expect(e.name).toEqual('SchemaValidationError')
    }
});

test('Test graphql transformer returns correct number of arguments from directive', () => {
    const validSchema = `type Post @model(queries: { list: "listPost" }, mutations: {create: "createCustom"}) { name: String! }`
    const transformer = new ValidObjectTransformer()
    const doc = parse(validSchema)
    const def = doc.definitions[0] as ObjectTypeDefinitionNode
    const map: any = getDirectiveArguments(def.directives[0])
    expect(map).not.toBeNull()
    expect(Object.keys(map)).toEqual(expect.arrayContaining(['mutations', 'queries']))
})