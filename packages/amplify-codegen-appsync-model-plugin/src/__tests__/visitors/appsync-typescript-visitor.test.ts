import { buildSchema, GraphQLSchema, parse, visit } from 'graphql';
import { validateTs } from '@graphql-codegen/testing';
import { TYPESCRIPT_SCALAR_MAP } from '../../scalars';
import { directives, scalars } from '../../scalars/supported-directives';
import { AppSyncModelTypeScriptVisitor } from '../../visitors/appsync-typescript-visitor';

const buildSchemaWithDirectives = (schema: String): GraphQLSchema => {
  return buildSchema([schema, directives, scalars].join('\n'));
};

const getVisitor = (schema: string, isDeclaration: boolean = false): AppSyncModelJavascriptVisitor => {
  const ast = parse(schema);
  const builtSchema = buildSchemaWithDirectives(schema);
  const visitor = new AppSyncModelTypeScriptVisitor(
    builtSchema,
    { directives, target: 'typescript', scalars: TYPESCRIPT_SCALAR_MAP, isDeclaration },
    {},
  );
  visit(ast, { leave: visitor });
  return visitor;
};

describe('Typescript visitor', () => {
  const schema = /* GraphQL */ `
    type SimpleModel @model {
      id: ID!
      name: String
      bar: String
    }
    enum SimpleEnum {
      enumVal1
      enumVal2
    }

    type SimpleNonModelType {
      id: ID!
      names: [String]
    }
  `;
  let visitor: AppSyncModelTypeScriptVisitor;
  beforeEach(() => {
    visitor = getVisitor(schema);
  });

  it('should generate import statements', () => {
    const imports = (visitor as any).generateImports();
    validateTs(imports);
    expect(imports).toMatchInlineSnapshot(`
      "import { ModelInit, MutableModel, PersistentModelConstructor } from \\"@aws-amplify/datastore\\";
      import { initSchema } from \\"@aws-amplify/datastore\\";

      import { schema } from \\"./schema\\";"
    `);
  });

  describe('enums', () => {
    it('should generate enum object', () => {
      jest.dontMock('../../languages/typescript-declaration-block');
      const enumObj = (visitor as any).enumMap['SimpleEnum'];
      const enums: string = (visitor as any).generateEnumDeclarations(enumObj);
      validateTs(enums);
      expect(enums).toMatchInlineSnapshot(`
        "export enum SimpleEnum {
          ENUM_VAL1 = \\"enumVal1\\",
          ENUM_VAL2 = \\"enumVal2\\"
        }"
      `);
    });
  });
});
