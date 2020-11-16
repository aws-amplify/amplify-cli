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
      foo: [Bar!] @connection
    }
    enum SimpleEnum {
      enumVal1
      enumVal2
    }

    type SimpleNonModelType {
      id: ID!
      names: [String]
    }

    type Bar @model {
      id: ID!
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
          readonly names?: (string | null)[];
          constructor(init: ModelInit<SimpleNonModelType>);
        }

        export declare class SimpleModel {
          readonly id: string;
          readonly name?: string;
          readonly bar?: string;
          readonly foo?: Bar[];
          constructor(init: ModelInit<SimpleModel>);
          static copyOf(source: SimpleModel, mutator: (draft: MutableModel<SimpleModel>) => MutableModel<SimpleModel> | void): SimpleModel;
        }

        export declare class Bar {
          readonly id: string;
          readonly simpleModelFooId?: string;
          constructor(init: ModelInit<Bar>);
          static copyOf(source: Bar, mutator: (draft: MutableModel<Bar>) => MutableModel<Bar> | void): Bar;
        }"
      `);
      expect(generateImportSpy).toBeCalledTimes(1);
      expect(generateImportSpy).toBeCalledWith();

      expect(generateEnumDeclarationsSpy).toBeCalledTimes(1);
      expect(generateEnumDeclarationsSpy).toBeCalledWith((declarationVisitor as any).enumMap['SimpleEnum'], true);

      expect(generateModelDeclarationSpy).toBeCalledTimes(3);
      expect(generateModelDeclarationSpy).toHaveBeenNthCalledWith(1, (declarationVisitor as any).modelMap['SimpleModel'], true);
      expect(generateModelDeclarationSpy).toHaveBeenNthCalledWith(2, (declarationVisitor as any).modelMap['Bar'], true);
      expect(generateModelDeclarationSpy).toHaveBeenNthCalledWith(3, (declarationVisitor as any).nonModelMap['SimpleNonModelType'], true);
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

      const { SimpleModel, Bar, SimpleNonModelType } = initSchema(schema);

      export {
        SimpleModel,
        Bar,
        SimpleEnum,
        SimpleNonModelType
      };"
    `);
    expect(generateEnumObjectSpy).toHaveBeenCalledWith((jsVisitor as any).enumMap['SimpleEnum']);

    expect(generateImportsJavaScriptImplementationSpy).toHaveBeenCalledTimes(1);
    expect(generateImportsJavaScriptImplementationSpy).toHaveBeenCalledWith();

    expect(generateModelInitializationSpy).toHaveBeenCalledTimes(1);
    expect(generateModelInitializationSpy).toHaveBeenCalledWith(
      [
        (jsVisitor as any).modelMap['SimpleModel'],
        (jsVisitor as any).modelMap['Bar'],
        (jsVisitor as any).nonModelMap['SimpleNonModelType'],
      ],
      false,
    );
  });
});

describe('Javascript visitor with default owner auth', () => {
  const schema = /* GraphQL */ `
    type SimpleModel @model @auth(rules: [{ allow: owner }]) {
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

  describe('generate', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should not add default owner field to Javascript declaration', () => {
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
          readonly names?: (string | null)[];
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
});

describe('Javascript visitor with custom owner field auth', () => {
  const schema = /* GraphQL */ `
    type SimpleModel @model @auth(rules: [{ allow: owner, ownerField: "customOwnerField", operations: [create, update, delete, read] }]) {
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

  describe('generate', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should not add custom owner field to Javascript declaration', () => {
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
          readonly names?: (string | null)[];
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
});

describe('Javascript visitor with multiple owner field auth', () => {
  const schema = /* GraphQL */ `
    type SimpleModel
      @model
      @auth(rules: [{ allow: owner, ownerField: "customOwnerField" }, { allow: owner, ownerField: "customOwnerField2" }]) {
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

  describe('generate', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should not add custom both owner fields to Javascript declaration', () => {
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
          readonly names?: (string | null)[];
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
});

describe('Javascript visitor with auth directives in field level', () => {
  const schema = /* GraphQL */ `
    type Employee @model @auth(rules: [{ allow: owner }, { allow: groups, groups: ["Admins"] }]) {
      id: ID!
      name: String!
      address: String!
      ssn: String @auth(rules: [{ allow: owner }])
    }
  `;

  let visitor: AppSyncModelJavascriptVisitor;
  beforeEach(() => {
    visitor = getVisitor(schema);
  });

  describe('generate', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should not add custom owner fields to Javascript declaration', () => {
      const declarationVisitor = getVisitor(schema, true);
      const generateImportSpy = jest.spyOn(declarationVisitor as any, 'generateImports');
      const generateModelDeclarationSpy = jest.spyOn(declarationVisitor as any, 'generateModelDeclaration');
      const declarations = declarationVisitor.generate();
      validateTs(declarations);
      expect(declarations).toMatchInlineSnapshot(`
        "import { ModelInit, MutableModel, PersistentModelConstructor } from \\"@aws-amplify/datastore\\";





        export declare class Employee {
          readonly id: string;
          readonly name: string;
          readonly address: string;
          readonly ssn?: string;
          constructor(init: ModelInit<Employee>);
          static copyOf(source: Employee, mutator: (draft: MutableModel<Employee>) => MutableModel<Employee> | void): Employee;
        }"
      `);

      expect(generateImportSpy).toBeCalledTimes(1);
      expect(generateImportSpy).toBeCalledWith();

      expect(generateModelDeclarationSpy).toBeCalledTimes(1);
      expect(generateModelDeclarationSpy).toHaveBeenNthCalledWith(1, (declarationVisitor as any).modelMap['Employee'], true);
    });
  });
});
