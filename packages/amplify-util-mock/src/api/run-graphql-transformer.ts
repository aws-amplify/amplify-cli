export async function runTransformer(context: any) {
  const transformerOutput = await context.amplify.executeProviderUtils(
    context,
    'awscloudformation',
    'compileSchema',
    {
      noConfig: true,
      forceCompile: true,
      dryRun: true,
      disableResolverOverrides: true,
    }
  );
  const stack = Object.values(transformerOutput.stacks).reduce(
    (prev, stack: any) => {
      return { ...prev, ...stack.Resources };
    },
    { ...transformerOutput.rootStack.Resources }
  );
  return { transformerOutput, stack };
}
