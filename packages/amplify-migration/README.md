## Usage

### Gen2 Codegen

In Gen1 root directory run the following to generate Gen2 code based on Gen1 configuration:

`npx @aws-amplify/migrate to-gen-2 prepare`

Once this command runs successfully, the Gen1 project is converted to Gen2 with `amplify` directory containing Gen2 code and `.amplify/migration/amplify` containing Gen1 configuration as a backup.

For executing the migration of resources from Gen1 to Gen2, run the following command:

`npx @aws-amplify/migrate to-gen-2 execute --from <GEN1_ROOT_STACK_NAME> --to <GEN2_ROOT_STACK_NAME>`

For moving the resources back from Gen2 to Gen1, run the following command:
`npx @aws-amplify/migrate to-gen-2 revert --from <GEN2_ROOT_STACK_NAME> --to <GEN1_ROOT_STACK_NAME>`
