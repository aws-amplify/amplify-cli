import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface GraphQLSchemaProperties {
    Definition?: Value<string>;
    DefinitionS3Location?: Value<string>;
    ApiId: Value<string>;
}
export default class GraphQLSchema extends ResourceBase {
    constructor(properties?: GraphQLSchemaProperties);
}
