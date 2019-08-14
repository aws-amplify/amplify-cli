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

import generateAllOps, { GQLTemplateOp, GQLAllOperations, GQLTemplateFragment } from './generator'
import { loadSchema } from './generator/utils/loading';
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
  const schemaData = loadSchema(schemaPath);
  if (!Object.keys(FILE_EXTENSION_MAP).includes(language)) {
    throw new Error(`Language ${language} not supported`)
  }


  const maxDepth = options.maxDepth || 3
  const useExternalFragmentForS3Object = options.language === 'graphql'
  const gqlOperations: GQLAllOperations = generateAllOps(schemaData, maxDepth, {
    useExternalFragmentForS3Object: useExternalFragmentForS3Object,
  })
  registerPartials()
  registerHelpers()

  const fileExtension = FILE_EXTENSION_MAP[language]
  if (options.separateFiles) {
    ['queries', 'mutations', 'subscriptions'].forEach((op) => {
      const ops = gqlOperations[op]
      if (ops.length) {
        const gql = render({ operations: gqlOperations[op], fragments: [] }, language)
        fs.writeFileSync(path.resolve(path.join(outputPath, `${op}.${fileExtension}`)), gql)
      }
    })

    if (gqlOperations.fragments.length) {
      const gql = render({ operations: [], fragments: gqlOperations.fragments }, language)
      fs.writeFileSync(path.resolve(path.join(outputPath, `fragments.${fileExtension}`)), gql)
    }
  } else {
    const ops = [
      ...gqlOperations.queries,
      ...gqlOperations.mutations,
      ...gqlOperations.subscriptions,
    ]
    if (ops.length) {
      const gql = render({ operations: ops, fragments: gqlOperations.fragments }, language)
      fs.writeFileSync(path.resolve(outputPath), gql)
    }
  }
}

function render(
  doc: { operations: Array<GQLTemplateOp>; fragments?: GQLTemplateFragment[] },
  language: string = 'graphql'
) {
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
  const gql = template(doc)
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
    javascript: 'babel',
    graphql: 'graphql',
    typescript: 'typescript',
    flow: 'flow',
    angular: 'graphql',
  }
  return prettier.format(str, { parser: parserMap[language] })
}

export default generate
