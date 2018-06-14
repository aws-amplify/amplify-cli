/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Targets {
    S3Targets?: List<S3Target>
    JdbcTargets?: List<JdbcTarget>

    constructor(properties: Targets) {
        Object.assign(this, properties)
    }
}

export class JdbcTarget {
    ConnectionName?: Value<string>
    Path?: Value<string>
    Exclusions?: List<Value<string>>

    constructor(properties: JdbcTarget) {
        Object.assign(this, properties)
    }
}

export class Schedule {
    ScheduleExpression?: Value<string>

    constructor(properties: Schedule) {
        Object.assign(this, properties)
    }
}

export class S3Target {
    Path?: Value<string>
    Exclusions?: List<Value<string>>

    constructor(properties: S3Target) {
        Object.assign(this, properties)
    }
}

export class SchemaChangePolicy {
    UpdateBehavior?: Value<string>
    DeleteBehavior?: Value<string>

    constructor(properties: SchemaChangePolicy) {
        Object.assign(this, properties)
    }
}

export interface CrawlerProperties {
    Role: Value<string>
    Classifiers?: List<Value<string>>
    Description?: Value<string>
    SchemaChangePolicy?: SchemaChangePolicy
    Schedule?: Schedule
    DatabaseName: Value<string>
    Targets: Targets
    TablePrefix?: Value<string>
    Name?: Value<string>
}

export default class Crawler extends ResourceBase {
    static Targets = Targets
    static JdbcTarget = JdbcTarget
    static Schedule = Schedule
    static S3Target = S3Target
    static SchemaChangePolicy = SchemaChangePolicy

    constructor(properties?: CrawlerProperties) {
        super('AWS::Glue::Crawler', properties)
    }
}
