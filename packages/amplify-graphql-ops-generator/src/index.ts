import generateAllOps, { GQLTemplateOp } from "./generateOperations";

import * as fs from "fs";
import * as path from "path";
import * as handlebars from "handlebars";
import * as prettier from "prettier";
import {
  buildClientSchema,
  DocumentNode,
  GraphQLSchema,
  IntrospectionSchema,
  IntrospectionQuery
} from "graphql";

const TEMPLATE_DIR = path.resolve(path.join(__dirname, "../templates"));
const FILE_EXTENSION_MAP = {
  javascript: 'js',
  graphql: 'graphql'
}

function generate(
  schemaPath: string,
  outputPath: string,
  options: { separateFiles: boolean, language: string }
): void {
  const language = options.language || 'graphql';
  const schemaContent = fs.readFileSync(schemaPath, "utf8").trim();
  const schemaData = JSON.parse(schemaContent);
  if (!schemaData.data && !schemaData.__schema) {
    // tslint:disable-line
    throw new Error(
      "GraphQL schema file should contain a valid GraphQL introspection query result"
    );
  }

  const schema: IntrospectionQuery = schemaData.data || schemaData;
  const gqlOperations = generateAllOps(schema);
  registerPartials();
  const fileExtension = FILE_EXTENSION_MAP[language];
  if (options.separateFiles) {
    ["queries", "mutations", "subscriptions"].forEach(op => {
      const gql = renderOps(gqlOperations[op], language);
      fs.writeFileSync(path.resolve(path.join(outputPath, `${op}.${fileExtension}`)), gql);
    });
  } else {
    const gql = renderOps([
      ...gqlOperations.queries,
      ...gqlOperations.mutations,
      ...gqlOperations.subscriptions
    ], language);
    fs.writeFileSync(path.resolve(outputPath), gql);
  }
}

function renderOps(operations: Array<GQLTemplateOp>, language: string='graphql') {
  const templateFiles = {
    javascript: 'javascript.hbs',
    graphql: 'graphql.hbs'
  };
  const parserMap = {
    javascript: 'babylon',
    graphql: 'graphql'
  }
  const templatePath = path.join(TEMPLATE_DIR, templateFiles[language]);
  const templateStr = fs.readFileSync(templatePath, "utf8");

  const template = handlebars.compile(templateStr, {
    noEscape: true,
    preventIndent: true
  });
  const gql = template({ operations: operations });

  const formattedQuery = prettier.format(gql, { parser: parserMap[language] });
  return formattedQuery;
}

function registerPartials() {
  // const templateDir = path.resolve(path.join(__dirname, "../templates"));
  const partials = fs.readdirSync(TEMPLATE_DIR);
  partials.forEach(partial => {
    if (!partial.startsWith("_") || !partial.endsWith(".hbs")) {
      return;
    }
    const partialPath = path.join(TEMPLATE_DIR, partial);
    const partialName = path.basename(partial).split(".")[0];
    const partialContent = fs.readFileSync(partialPath, "utf8");
    handlebars.registerPartial(partialName.substring(1), partialContent);
  });
}

export default generate;
