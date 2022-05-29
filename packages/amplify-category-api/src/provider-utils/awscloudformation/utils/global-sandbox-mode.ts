export function defineGlobalSandboxMode(link: string): string {
  return `# This "input" configures a global authorization rule to enable public access to
# all models in this schema. Learn more about authorization rules here: ${link}
input AMPLIFY { globalAuthRule: AuthRule = { allow: public } } # FOR TESTING ONLY!\n
`;
}
