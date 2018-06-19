import {
    ObjectTypeDefinitionNode, DirectiveNode
} from 'graphql'
import GraphQLTransform from './GraphQLTransform'
import TransformerContext from './TransformerContext'
import Transformer from './Transformer'

class ValidObjectTransformer extends Transformer {
    constructor() {
        super('ValidObjectTransformer', 'directive @ObjectDirective on OBJECT')
    }

    public object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => {
        return;
    }
}

const validSchema = `type Post @ObjectDirective { id: ID! }`
const transformer = new GraphQLTransform({
    transformers: [
        new ValidObjectTransformer()
    ]
})
const out = transformer.transform(validSchema);
console.log(out);
