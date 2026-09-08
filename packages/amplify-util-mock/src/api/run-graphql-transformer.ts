export async function runTransformer(context: any, overrideConfig = {}) {
  const transformerOutput = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
    noConfig: true,
    forceCompile: true,
    dryRun: true,
    disableResolverOverrides: true,
    disableFunctionOverrides: true,
    disablePipelineFunctionOverrides: true,
    overrideConfig,
  });
  return { transformerOutput };
}
