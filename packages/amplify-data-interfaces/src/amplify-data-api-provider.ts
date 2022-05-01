import { DocumentNode } from 'graphql';

/**
 * The AmplifyDataApiProvider serves as a definition for the API used for external interactions with the data layer
 */
export interface AmplifyDataApiProvider {
  readSchema: (path: string) => Promise<DocumentNode>;
  // getRemovedTables: (referencedTables: string[]) => string[];
}
