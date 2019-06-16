import * as fs from 'fs'
import * as path from 'path'

import generate from './index';

function generateAndSave(
  schemaPath: string,
  outputPath: string,
  options: { separateFiles: boolean; language: string; maxDepth: number }
): void {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
  const gql = generate(schema.data, options)
  if (gql) {
    fs.writeFileSync(path.resolve(outputPath), gql)
  }
}

export default generateAndSave
