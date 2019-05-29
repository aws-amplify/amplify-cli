import './polyfills/Object.assign'
import TransformerContext from './TransformerContext'
import Transformer from './Transformer'
import ITransformer from './ITransformer'
import GraphQLTransform from './GraphQLTransform'
import { collectDirectiveNames } from './collectDirectives'
import { stripDirectives } from './stripDirectives'
import {
    buildProject as buildAPIProject,
    uploadDeployment as uploadAPIProject,
    readSchema as readProjectSchema,
    migrateAPIProject,
    revertAPIMigration,
    readProjectConfiguration
} from './util/amplifyUtils'

export * from './errors'
export * from './util'

export default GraphQLTransform

export {
    TransformerContext,
    Transformer,
    ITransformer,
    collectDirectiveNames,
    stripDirectives,
    buildAPIProject,
    migrateAPIProject,
    uploadAPIProject,
    readProjectSchema,
    readProjectConfiguration,
    revertAPIMigration
}