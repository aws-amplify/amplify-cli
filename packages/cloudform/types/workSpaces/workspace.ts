/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface WorkspaceProperties {
    BundleId: Value<string>
    DirectoryId: Value<string>
    RootVolumeEncryptionEnabled?: Value<boolean>
    UserName: Value<string>
    UserVolumeEncryptionEnabled?: Value<boolean>
    VolumeEncryptionKey?: Value<string>
}

export default class Workspace extends ResourceBase {


    constructor(properties?: WorkspaceProperties) {
        super('AWS::WorkSpaces::Workspace', properties)
    }
}
