# analytics/cfn-condition-resolver.ts — CFNConditionResolver

Evaluates CloudFormation conditions using deployed stack parameters.

## How It Works

Constructed with a parsed CFN template. `resolve(parameters)` evaluates all conditions in the `Conditions` block and returns a new template with:

- Resources whose conditions evaluate to false removed
- `Fn::If` property values resolved to the appropriate branch

Supports `Fn::Equals`, `Fn::Not`, `Fn::Or`, `Fn::And`, nested condition references (`{ Condition: 'name' }`), and parameter refs (`{ Ref: 'paramName' }`). Does not mutate the original template — works on a deep clone.

## Relationship to Other Components

- Called by `KinesisCfnConverter` during the pre-transmute step to remove conditional resources before passing the template to `cdk-from-cfn`
- Receives deployed stack parameters from CloudFormation `DescribeStacks`
