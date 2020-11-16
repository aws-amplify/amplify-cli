export interface TransformerResourceProvider {
  generateResourceName(name: string): string;
}
