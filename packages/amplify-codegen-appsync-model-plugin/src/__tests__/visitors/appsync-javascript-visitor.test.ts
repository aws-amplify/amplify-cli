import { buildSchema, GraphQLSchema, parse, visit } from 'graphql';
import { validateTs } from '@graphql-codegen/testing';
import { TYPESCRIPT_SCALAR_MAP } from '../../scalars';
import { directives, scalars } from '../../scalars/supported-directives';
import { AppSyncModelJavascriptVisitor } from '../../visitors/appsync-javascript-visitor';

const buildSchemaWithDirectives = (schema: String): GraphQLSchema => {
  return buildSchema([schema, directives, scalars].join('\n'));
};

const getVisitor = (schema: string, isDeclaration: boolean = false): AppSyncModelJavascriptVisitor => {
  const ast = parse(schema);
  const builtSchema = buildSchemaWithDirectives(schema);
  const visitor = new AppSyncModelJavascriptVisitor(
    builtSchema,
    { directives, target: 'javascript', scalars: TYPESCRIPT_SCALAR_MAP, isDeclaration },
    {},
  );
  visit(ast, { leave: visitor });
  return visitor;
};

describe('Javascript visitor', () => {
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
  let visitor: AppSyncModelJavascriptVisitor;
  beforeEach(() => {
    visitor = getVisitor(schema);
  });

  describe('enums', () => {
    it('should generate enum object', () => {
      const enumObj = (visitor as any).enumMap['SimpleEnum'];
      const enums: string = (visitor as any).generateEnumObject(enumObj);
      validateTs(enums);
      expect(enums).toMatchInlineSnapshot(`
        "const SimpleEnum = {
          \\"ENUM_VAL1\\": \\"enumVal1\\",
          \\"ENUM_VAL2\\": \\"enumVal2\\"
        };"
      `);
    });

    it('should export enum when exportEnum is set to true', () => {
      const enumObj = (visitor as any).enumMap['SimpleEnum'];
      const enums = (visitor as any).generateEnumObject(enumObj, true);
      validateTs(enums);
      expect(enums).toMatchInlineSnapshot(`
        "export const SimpleEnum = {
          \\"ENUM_VAL1\\": \\"enumVal1\\",
          \\"ENUM_VAL2\\": \\"enumVal2\\"
        };"
      `);
    });

    it('should generate import statements', () => {
      const imports = (visitor as any).generateImportsJavaScriptImplementation();
      validateTs(imports);
      expect(imports).toMatchInlineSnapshot(`
"// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';"
`);
    });
  });

  describe('generate', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should generate Javascript declaration', () => {
      const declarationVisitor = getVisitor(schema, true);
      const generateImportSpy = jest.spyOn(declarationVisitor as any, 'generateImports');
      const generateEnumDeclarationsSpy = jest.spyOn(declarationVisitor as any, 'generateEnumDeclarations');
      const generateModelDeclarationSpy = jest.spyOn(declarationVisitor as any, 'generateModelDeclaration');
      const declarations = declarationVisitor.generate();
      validateTs(declarations);
      expect(declarations).toMatchInlineSnapshot(`
"import { ModelInit, MutableModel, PersistentModelConstructor } from \\"@aws-amplify/datastore\\";

export enum SimpleEnum {
  ENUM_VAL1 = \\"enumVal1\\",
  ENUM_VAL2 = \\"enumVal2\\"
}

export declare class SimpleNonModelType {
  readonly id: string;
  readonly names?: string[];
  constructor(init: ModelInit<SimpleNonModelType>);
}

export declare class SimpleModel {
  readonly id: string;
  readonly name?: string;
  readonly bar?: string;
  constructor(init: ModelInit<SimpleModel>);
  static copyOf(source: SimpleModel, mutator: (draft: MutableModel<SimpleModel>) => MutableModel<SimpleModel> | void): SimpleModel;
}"
`);
      expect(generateImportSpy).toBeCalledTimes(1);
      expect(generateImportSpy).toBeCalledWith();

      expect(generateEnumDeclarationsSpy).toBeCalledTimes(1);
      expect(generateEnumDeclarationsSpy).toBeCalledWith((declarationVisitor as any).enumMap['SimpleEnum'], true);

      expect(generateModelDeclarationSpy).toBeCalledTimes(2);
      expect(generateModelDeclarationSpy).toHaveBeenNthCalledWith(1, (declarationVisitor as any).modelMap['SimpleModel'], true);
      expect(generateModelDeclarationSpy).toHaveBeenNthCalledWith(2, (declarationVisitor as any).nonModelMap['SimpleNonModelType'], true);
    });
  });

  it('should generate Javascript code when declaration is set to false', () => {
    const jsVisitor = getVisitor(schema, false);
    const generateImportsJavaScriptImplementationSpy = jest.spyOn(jsVisitor as any, 'generateImportsJavaScriptImplementation');
    const generateEnumObjectSpy = jest.spyOn(jsVisitor as any, 'generateEnumObject');
    const generateModelInitializationSpy = jest.spyOn(jsVisitor as any, 'generateModelInitialization');
    const codeBlock = jsVisitor.generate();
    validateTs(codeBlock);
    expect(codeBlock).toMatchInlineSnapshot(`
"// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const SimpleEnum = {
  \\"ENUM_VAL1\\": \\"enumVal1\\",
  \\"ENUM_VAL2\\": \\"enumVal2\\"
};

const { SimpleModel, SimpleNonModelType } = initSchema(schema);

export {
  SimpleModel,
  SimpleEnum,
  SimpleNonModelType
};"
`);
    expect(generateEnumObjectSpy).toHaveBeenCalledWith((jsVisitor as any).enumMap['SimpleEnum']);

    expect(generateImportsJavaScriptImplementationSpy).toHaveBeenCalledTimes(1);
    expect(generateImportsJavaScriptImplementationSpy).toHaveBeenCalledWith();

    expect(generateModelInitializationSpy).toHaveBeenCalledTimes(1);
    expect(generateModelInitializationSpy).toHaveBeenCalledWith(
      [(jsVisitor as any).modelMap['SimpleModel'], (jsVisitor as any).nonModelMap['SimpleNonModelType']],
      false,
    );
  });
});
