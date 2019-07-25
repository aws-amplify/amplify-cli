import * as path from 'path';
import * as fs from 'fs';
export function updateSchema(projectDir: string, projectName: string, schemaText: string) {
    const schemaPath = path.join(projectDir, 'amplify', 'backend', 'api', projectName, 'schema.graphql');
    fs.writeFileSync(schemaPath, schemaText);
}

export function updateConfig(projectDir: string, projectName: string, config: any = {}) {
    const configPath = path.join(projectDir, 'amplify', 'backend', 'api', projectName, 'transform.conf.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
}