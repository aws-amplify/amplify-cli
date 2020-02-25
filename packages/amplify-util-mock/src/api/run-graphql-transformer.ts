export async function runTransformer(context: any) {
  const transformerOutput = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
    noConfig: true,
    forceCompile: true,
    dryRun: true,
    disableResolverOverrides: true,
  });
  return { transformerOutput };
}
