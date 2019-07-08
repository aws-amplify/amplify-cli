import * as path from 'path';
import * as fs from 'fs';
export function updateSchema(projectDir: string, projectName: string, schemaText: string) {
    const schemaPath = path.join(projectDir, 'amplify', 'backend', 'api', projectName, 'schema.graphql');
    fs.writeFileSync(schemaPath, schemaText);
}