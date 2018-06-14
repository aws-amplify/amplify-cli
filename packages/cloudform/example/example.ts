import cloudform, {Fn, Refs, EC2, StringParameter, ResourceTag} from ".." // you should import from cloudform here instead
import {NetworkingConfig} from './config'

// you can define your own shortcuts for repeating Refs
const DeployEnv = Fn.Ref('DeployEnv')

// it might be useful to eliminate the magic strings by predefining Conditions & Resources keys
const Conditions = {
    FirstCondition: 'FirstCondition',
    TestCondition: 'TestCondition'
}

const Resources = {
    VPC: 'VPC'
}

// the actual template definition
export default cloudform({
    Description: 'My template',
    Parameters: {
        DeployEnv: new StringParameter({
            Description: 'Deploy environment name',
            AllowedValues: ['stage', 'production']
        })
    },
    Mappings: {
        SomeGroup: {
            stage: {
                SomeValue: 'one'
            },
            production: {
                SomeValue: 'two'
            }
        }
    },
    Conditions: {
        [Conditions.FirstCondition]: Fn.Equals(1, 2),
        [Conditions.TestCondition]: Fn.And([
            {Condition: Conditions.FirstCondition},
            Fn.Equals(Fn.FindInMap('SomeGroup', DeployEnv, 'SomeValue'), 'three')
        ])
    },
    Resources: {
        [Resources.VPC]: new EC2.VPC({
            CidrBlock: NetworkingConfig.VPC.CIDR,
            EnableDnsHostnames: true,
            Tags: [
                new ResourceTag('Application', Refs.StackName),
                new ResourceTag('Network', 'Public'),
                new ResourceTag('Name', Fn.Join('-', [Refs.StackId, Resources.VPC]))
            ]
        }).condition(Conditions.TestCondition),

        // can handle raw data pasted from existing JSON templates - convenient for transition phase
        "ECSSecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup",
            "Properties": {
                "GroupDescription": "ECS Security Group",
                "VpcId": {
                    "Ref": "VPC"
                }
            }
        }
    },
    Outputs: {
        VPCIpv6CidrBlocks: {
            Value: Fn.GetAtt(Resources.VPC, 'Ipv6CidrBlocks')
        }
    }
})
