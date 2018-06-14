# cloudform
TypeScript-based imperative way to define AWS CloudFormation templates

[Read the introductory blog post](https://brightinventions.pl/blog/introducing-cloudform-tame-aws-cloudformation-templates/)

## Installation

`npm install --save-dev cloudform`

## Usage

1. Define your AWS CloudFormation template in a TypeScript file, for example `template.ts`:

```typescript
import cloudform, {Fn, Refs, EC2, StringParameter, ResourceTag} from "cloudform"

export default cloudform({
    Description: 'My template',
    Parameters: {
        DeployEnv: new StringParameter({
            Description: 'Deploy environment name',
            AllowedValues: ['stage', 'production']
        })
    },
    Mappings: {
        DeploymentConfig: {
            stage: {
                InstanceType: 't2.small'
            },
            production: {
                InstanceType: 't2.large'
            }
        }
    },
    Resources: {
        VPC: new EC2.VPC({
            CidrBlock: NetworkingConfig.VPC.CIDR,
            EnableDnsHostnames: true,
            Tags: [
                new ResourceTag('Application', Refs.StackName),
                new ResourceTag('Network', 'Public'),
                new ResourceTag('Name', Fn.Join('-', [Refs.StackId, 'VPC']))
            ]
        }),
        Instance: new EC2.Instance({
            InstanceType: Fn.FindInMap('DeploymentConfig', Fn.Ref('DeployEnv'), 'InstanceType'),
            ImageId: 'ami-a85480c7'
        }).dependsOn('VPC')
    }
})
```

See also [example/example.ts](https://github.com/bright/cloudform/blob/master/example/example.ts).

2\. Run `cloudform path/to/your/template.ts` to generate the CloudFormation template as JSON. 

It makes sense to define it in your `npm` scripts and run within your build or deployment pipeline, for example:

```json
"scripts"
  // ...
  "generate-cloudformation-template": "cloudform path/to/your/template > template.aws"
}
```

## API

The types are generated automatically from the [AWS-provided schema file](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-resource-specification.html), so `cloudform` supports all the types available in AWS CloudFormation. 

The simple convention is used – all the AWS types’ namespaces are available directly as exports from the `cloudform` package. All the resources within this package are available inside. This way `EC2.VPC` object from our example translates into `AWS::EC2::VPC` type we can find in [CloudFormation documentation](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-vpc.html). All the properties also match one-to-one, including casing.

All [Intrinsic Tunctions](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html) are available within `Fn` namespace:

```typescript
Fn.Base64(value: Value<string>)
Fn.FindInMap(mapName: Value<string>, topLevelKey: Value<string>, secondLevelKey: Value<string>)
Fn.GetAtt(logicalNameOfResource: Value<string>, attributeName: Value<string>)
Fn.GetAZs(region?: Value<string>)
Fn.ImportValue(sharedValueToImport: Value<any>)
Fn.Join(delimiter: Value<string>, values: List<any>)
Fn.Select(index: Value<number>, listOfObjects: List<any>)
Fn.Split(delimiter: Value<string>, sourceString: Value<string>)
Fn.Sub(string: Value<string>, vars [key: string]: Value<any> })
Fn.Ref(logicalName: Value<string>)

// condition functions
Fn.And(condition: List<Condition>)
Fn.Equals(left: any, right: any)
Fn.If(conditionName: Value<string>, valueIfTrue: any, valueIfFalse: any)
Fn.Not(condition: Condition)
Fn.Or(condition: List<Condition>)
```

All the [Pseudo Parameters](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/pseudo-parameter-reference.html) are there, too:

```
Ref.AccountId
Ref.NotificationARNs
Ref.NoValue
Ref.Partition
Ref.Region
Ref.StackId
Ref.StackName
Ref.URLSuffix
```

## Licence

[MIT](https://github.com/bright/cloudform/blob/master/LICENCE)