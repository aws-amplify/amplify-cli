import './polyfills/Object.assign'
import TransformerContext from './TransformerContext'
import Transformer from './Transformer'
import GraphQLTransform from './GraphQLTransform'
import { collectDirectiveNames } from './collectDirectives'
import { stripDirectives } from './stripDirectives'
<<<<<<< HEAD
import { buildProject as buildAPIProject, uploadDeployment as uploadAPIProject } from './util/amplifyUtils'
=======
import { buildProject as buildAPIProject, uploadDeployment as uploadAPIProject, readSchema as readProjectSchema } from './util/amplifyUtils'
>>>>>>> 9378224b7137c1d316f9baa07f650abe84c5a79d

export * from './errors'

export default GraphQLTransform

export {
    TransformerContext,
    Transformer,
    collectDirectiveNames,
    stripDirectives,
    buildAPIProject,
<<<<<<< HEAD
    uploadAPIProject
=======
    uploadAPIProject,
    readProjectSchema
>>>>>>> 9378224b7137c1d316f9baa07f650abe84c5a79d
}