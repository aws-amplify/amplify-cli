/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface DBInstanceProperties {
    DBParameterGroupName?: Value<string>
    DBInstanceClass: Value<string>
    AllowMajorVersionUpgrade?: Value<boolean>
    DBClusterIdentifier?: Value<string>
    AvailabilityZone?: Value<string>
    PreferredMaintenanceWindow?: Value<string>
    AutoMinorVersionUpgrade?: Value<boolean>
    DBSubnetGroupName?: Value<string>
    DBInstanceIdentifier?: Value<string>
    DBSnapshotIdentifier?: Value<string>
    Tags?: ResourceTag[]
}

export default class DBInstance extends ResourceBase {


    constructor(properties?: DBInstanceProperties) {
        super('AWS::Neptune::DBInstance', properties)
    }
}
