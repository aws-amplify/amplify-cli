import * as fs from 'fs'
import * as path from 'path'

import generate, { FILE_EXTENSION_MAP } from './index';

function generateAndSave(
  schemaPath: string,
  outputPath: string,
  options: { separateFiles: boolean; language: string; maxDepth: number }
): void {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))

  if (options.separateFiles) {
    const gqlOperations = generate(schema.data, {...options, asSeparateOperations: options.separateFiles})
    Object.keys(gqlOperations).forEach(op => {
      const ops = gqlOperations[op]
      if (ops) {
        const fileExtension = FILE_EXTENSION_MAP[options.language]
        fs.writeFileSync(path.resolve(path.join(outputPath, `${op}.${fileExtension}`)), ops)
      }
    })
  } else {
    const gql = generate(schema.data, options)
    if (gql) {
      fs.writeFileSync(path.resolve(outputPath), gql)
    }
  }
}

export default generateAndSave
