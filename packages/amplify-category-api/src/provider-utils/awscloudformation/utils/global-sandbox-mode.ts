export function defineGlobalSandboxMode(): string {
  return `# This "input" configures a global authorization rule to enable public access to
# all models in this schema. Learn more about authorization rules here: https://docs.amplify.aws/cli/graphql-transformer/auth
input AMPLIFY { globalAuthRule: AuthRule = { allow: public } } # FOR TESTING ONLY!\n
`;
}
