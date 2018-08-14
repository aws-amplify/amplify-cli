import './polyfills/Object.assign'
import TransformerContext from './TransformerContext'
import Transformer from './Transformer'
import GraphQLTransform from './GraphQLTransform'
import { collectDirectiveNames } from './collectDirectives'

export * from './errors'

export default GraphQLTransform

export {
    TransformerContext,
    Transformer,
    collectDirectiveNames
}