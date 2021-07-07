import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'

export interface AmplifyRootStackTemplateProps {
    Parameters: {[k : string] : cdk.CfnParameter}
    Resources: AmplifyRootStackResourceProps
    Outputs: {[k : string] : cdk.CfnOutput}
    Mappinngs: {[k : string] : cdk.CfnMapping}
    Conditions: {[k : string] : cdk.CfnCondition}
}
 
export interface AmplifyRootStackResourceProps {
    DeploymentBucket: s3.CfnBucket
    authRole: iam.CfnRole
    unAuthRole: iam.CfnRole
}