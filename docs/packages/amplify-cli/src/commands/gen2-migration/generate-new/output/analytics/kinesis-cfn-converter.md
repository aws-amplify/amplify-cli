# analytics/kinesis-cfn-converter.ts — KinesisCfnConverter

Converts Kinesis CloudFormation templates to CDK constructs using `cdk-from-cfn`.

## How It Works

`generateKinesisAnalyticsL1Code(definition)` performs the full conversion pipeline:

1. Downloads the nested stack's CFN template from S3 using the `s3TemplateURL` from `amplify-meta.json`
2. Looks up the nested stack's physical name and parameters via CloudFormation `DescribeStackResources` and `DescribeStacks`
3. Renames `env` parameter references to `branchName` in the template
4. Resolves CFN conditions using deployed parameters via `CFNConditionResolver`
5. Runs `cdk_from_cfn.transmute()` to produce TypeScript CDK code
6. Formats the output with prettier and writes the construct file
7. Extracts the construct class name from the generated code via regex

Returns an `AnalyticsCodegenResult` with the class name, file name, resource name, shard count, and physical stream name.

## Relationship to Other Components

- Called by `AnalyticsKinesisGenerator` during `execute()`
- Uses `Gen1App.clients.s3` and `Gen1App.clients.cloudFormation` directly (not through `AwsFetcher`)
- Uses `CFNConditionResolver` for condition evaluation
- The generated construct file is imported by the `analytics/resource.ts` that `AnalyticsRenderer` produces
