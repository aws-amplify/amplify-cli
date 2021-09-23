import { parse, print, visit } from 'graphql'
import { migrateKeys } from './migrators/key'
import { migrateAuth } from './migrators/auth'
import { migrateConnection } from './migrators/connection'
import { readSchemaDocuments, getResourceDir } from './utils'
import { DocumentNode } from 'graphql/language';


function migrateGraphQLSchema(schema: string, authMode: string, massSchema: DocumentNode): string {
  let output = parse(schema)
  visit(output, {
    ObjectTypeDefinition: {
      enter(node) {
        migrateKeys(node);
        migrateAuth(node, authMode);
        migrateConnection(node, massSchema);
        return node;
      }
    }
  });

  return print(output);
}

export function migrateToV2Transformer(): void {
  const schemaDocuments = readSchemaDocuments(getResourceDir());
}
