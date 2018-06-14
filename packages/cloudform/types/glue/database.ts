/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class DatabaseInput {
    LocationUri?: Value<string>
    Description?: Value<string>
    Parameters?: any
    Name?: Value<string>

    constructor(properties: DatabaseInput) {
        Object.assign(this, properties)
    }
}

export interface DatabaseProperties {
    DatabaseInput: DatabaseInput
    CatalogId: Value<string>
}

export default class Database extends ResourceBase {
    static DatabaseInput = DatabaseInput

    constructor(properties?: DatabaseProperties) {
        super('AWS::Glue::Database', properties)
    }
}
