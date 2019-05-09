import * as fs from 'fs'
import * as path from 'path'

import generate from './index';

function generateAndSave(
  schemaPath: string,
  outputPath: string,
  options: { separateFiles: boolean; language: string; maxDepth: number }
): void {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8').trim()
  const schemaData = JSON.parse(schemaContent)
  const gql = generate(schemaData, options)
  if (gql) {
    fs.writeFileSync(path.resolve(outputPath), gql)
  }
}

export default generateAndSave
