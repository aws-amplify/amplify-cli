export interface TransformerResourceProvider {
  generateResourceName(name: string): string;
  generateIAMRoleName(name: string): string;
}
