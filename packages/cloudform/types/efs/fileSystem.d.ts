import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class ElasticFileSystemTag {
    Key: Value<string>;
    Value: Value<string>;
    constructor(properties: ElasticFileSystemTag);
}
export interface FileSystemProperties {
    Encrypted?: Value<boolean>;
    FileSystemTags?: List<ElasticFileSystemTag>;
    KmsKeyId?: Value<string>;
    PerformanceMode?: Value<string>;
}
export default class FileSystem extends ResourceBase {
    static ElasticFileSystemTag: typeof ElasticFileSystemTag;
    constructor(properties?: FileSystemProperties);
}
