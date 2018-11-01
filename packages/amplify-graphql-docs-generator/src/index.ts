import * as fs from 'fs'
import * as path from 'path'
import * as handlebars from 'handlebars'
import * as prettier from 'prettier'
const camelCase = require('camel-case')

import {
  buildClientSchema,
  DocumentNode,
  GraphQLSchema,
  IntrospectionSchema,
  IntrospectionQuery,
} from 'graphql'

import generateAllOps, { GQLTemplateOp, GQLAllOperations } from './generator'

const TEMPLATE_DIR = path.resolve(path.join(__dirname, '../templates'))
const FILE_EXTENSION_MAP = {
  javascript: 'js',
  graphql: 'graphql',
  flow: 'js',
  typescript: 'ts',
  angular: 'graphql',
}

function generate(
  schemaPath: string,
  outputPath: string,
  options: { separateFiles: boolean; language: string; maxDepth: number }
): void {
  const language = options.language || 'graphql'
  const schemaContent = fs.readFileSync(schemaPath, 'utf8').trim()
  const schemaData = JSON.parse(schemaContent)
  if (!schemaData.data && !schemaData.__schema) {
    // tslint:disable-line
    throw new Error('GraphQL schema file should contain a valid GraphQL introspection query result')
  }
  if (!Object.keys(FILE_EXTENSION_MAP).includes(language)) {
    throw new Error(`Language ${language} not supported`)
  }

  const schema: IntrospectionQuery = schemaData.data || schemaData
  const maxDepth = options.maxDepth || 3
  const gqlOperations: GQLAllOperations = generateAllOps(schema, maxDepth)
  registerPartials()
  registerHelpers()

  const fileExtension = FILE_EXTENSION_MAP[language]
  if (options.separateFiles) {
    ['queries', 'mutations', 'subscriptions'].forEach((op) => {
      const ops = gqlOperations[op]
      if (ops.length) {
        const gql = renderOps(gqlOperations[op], language)
        fs.writeFileSync(path.resolve(path.join(outputPath, `${op}.${fileExtension}`)), gql)
      }
    })
  } else {
    const ops = [
      ...gqlOperations.queries,
      ...gqlOperations.mutations,
      ...gqlOperations.subscriptions,
    ]
    if (ops.length) {
      const gql = renderOps(ops, language)
      fs.writeFileSync(path.resolve(outputPath), gql)
    }
  }
}

function renderOps(operations: Array<GQLTemplateOp>, language: string = 'graphql') {
  const templateFiles = {
    javascript: 'javascript.hbs',
    graphql: 'graphql.hbs',
    typescript: 'typescript.hbs',
    flow: 'flow.hbs',
    angular: 'graphql.hbs',
  }

  const templatePath = path.join(TEMPLATE_DIR, templateFiles[language])
  const templateStr = fs.readFileSync(templatePath, 'utf8')

  const template = handlebars.compile(templateStr, {
    noEscape: true,
    preventIndent: true,
  })
  const gql = template({ operations: operations })
  return format(gql, language)
}

function registerPartials() {
  const partials = fs.readdirSync(TEMPLATE_DIR)
  partials.forEach((partial) => {
    if (!partial.startsWith('_') || !partial.endsWith('.hbs')) {
      return
    }
    const partialPath = path.join(TEMPLATE_DIR, partial)
    const partialName = path.basename(partial).split('.')[0]
    const partialContent = fs.readFileSync(partialPath, 'utf8')
    handlebars.registerPartial(partialName.substring(1), partialContent)
  })
}

function registerHelpers() {
  handlebars.registerHelper('format', function(options: any) {
    const result = options.fn(this)
    return format(result)
  })

  handlebars.registerHelper('camelCase', camelCase)
}

function format(str: string, language: string = 'graphql'): string {
  const parserMap = {
    javascript: 'babylon',
    graphql: 'graphql',
    typescript: 'typescript',
    flow: 'flow',
    angular: 'graphql',
  }
  return prettier.format(str, { parser: parserMap[language] })
}

export default generate
