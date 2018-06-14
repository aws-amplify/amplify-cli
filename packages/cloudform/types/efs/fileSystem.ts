/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ElasticFileSystemTag {
    Key: Value<string>
    Value: Value<string>

    constructor(properties: ElasticFileSystemTag) {
        Object.assign(this, properties)
    }
}

export interface FileSystemProperties {
    Encrypted?: Value<boolean>
    FileSystemTags?: List<ElasticFileSystemTag>
    KmsKeyId?: Value<string>
    PerformanceMode?: Value<string>
}

export default class FileSystem extends ResourceBase {
    static ElasticFileSystemTag = ElasticFileSystemTag

    constructor(properties?: FileSystemProperties) {
        super('AWS::EFS::FileSystem', properties)
    }
}
