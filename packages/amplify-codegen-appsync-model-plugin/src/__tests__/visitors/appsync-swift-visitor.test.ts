import { buildSchema, GraphQLSchema, parse, visit } from 'graphql';
import { directives, scalars } from '../../scalars/supported-directives';
import { SWIFT_SCALAR_MAP } from '../../scalars';
import { AppSyncSwiftVisitor } from '../../visitors/appsync-swift-visitor';
import { CodeGenGenerateEnum } from '../../visitors/appsync-visitor';

const buildSchemaWithDirectives = (schema: String): GraphQLSchema => {
  return buildSchema([schema, directives, scalars].join('\n'));
};

const getVisitor = (schema: string, selectedType?: string, generate: CodeGenGenerateEnum = CodeGenGenerateEnum.code) => {
  const ast = parse(schema);
  const builtSchema = buildSchemaWithDirectives(schema);
  const visitor = new AppSyncSwiftVisitor(
    builtSchema,
    { directives, target: 'swift', generate, scalars: SWIFT_SCALAR_MAP },
    { selectedType },
  );
  visit(ast, { leave: visitor });
  return visitor;
};

describe('AppSyncSwiftVisitor', () => {
  it('Should generate a class for a Model', () => {
    const schema = /* GraphQL */ `
      type SimpleModel @model {
        id: ID!
        name: String
        bar: String
      }
    `;

    const visitor = getVisitor(schema, 'SimpleModel');
    const generatedCode = visitor.generate();
    expect(generatedCode).toMatchSnapshot();
    const metaDataVisitor = getVisitor(schema, 'SimpleModel', CodeGenGenerateEnum.metadata);
    const generatedMetaData = metaDataVisitor.generate();
    expect(generatedMetaData).toMatchSnapshot();
  });

  it('should generate an enum for enum type', () => {
    const schema = /* GraphQL */ `
      enum status {
        pending
        done
      }
    `;

    const visitor = getVisitor(schema, 'status');
    const generatedCode = visitor.generate();
    expect(generatedCode).toMatchSnapshot();
    const metaDataVisitor = getVisitor(schema, 'status', CodeGenGenerateEnum.metadata);
    const generatedMetaData = metaDataVisitor.generate();
    expect(generatedMetaData).toMatchSnapshot();
  });

  it('should generate model with snake case', () => {
    const schema = /* GraphQL */ `
      type snake_case @model {
        id: ID!
        name: String
      }
    `;

    const visitor = getVisitor(schema, 'snake_case');
    const generatedCode = visitor.generate();
    expect(generatedCode).toMatchSnapshot();

    const metaDataVisitor = getVisitor(schema, 'snake_case', CodeGenGenerateEnum.metadata);
    const generatedMetaData = metaDataVisitor.generate();
    expect(generatedMetaData).toMatchSnapshot();
  });

  it('should generate model with with snake_case field', () => {
    const schema = /* GraphQL */ `
      type SnakeCaseField @model {
        id: ID!
        first_name: String
      }
    `;

    const visitor = getVisitor(schema, 'SnakeCaseField');
    const generatedCode = visitor.generate();
    expect(generatedCode).toMatchSnapshot();
  });

  it('should generate model with key directive', () => {
    const schema = /* GraphQL */ `
      type authorBook @model @key(name: "byAuthor", fields: ["author_id"]) @key(name: "byBook", fields: ["book_id"]) {
        id: ID!
        author_id: ID!
        book_id: ID!
        author: String
        book: String
      }
    `;
    const visitor = getVisitor(schema, 'authorBook');
    const generatedCode = visitor.generate();
    expect(generatedCode).toMatchSnapshot();

    const metaDataVisitor = getVisitor(schema, 'authorBook', CodeGenGenerateEnum.metadata);
    const generatedMetaData = metaDataVisitor.generate();
    expect(generatedMetaData).toMatchSnapshot();
  });

  describe('connection', () => {
    describe('One to Many connection', () => {
      const schema = /* GraphQL */ `
        type Todo @model {
          id: ID!
          title: String!
          done: Boolean!
          description: String
          due_date: String
          version: Int!
          value: Float
          tasks: [task] @connection(name: "TodoTasks")
        }

        type task @model {
          id: ID
          title: String!
          done: Boolean!
          todo: Todo @connection(name: "TodoTasks")
          time: AWSTime
          createdOn: AWSDate
        }
      `;
      it('should generate one side of the connection', () => {
        const visitor = getVisitor(schema, 'Todo');
        const generatedCode = visitor.generate();
        expect(generatedCode).toMatchSnapshot();

        const metaDataVisitor = getVisitor(schema, 'Todo', CodeGenGenerateEnum.metadata);
        const generatedMetaData = metaDataVisitor.generate();
        expect(generatedMetaData).toMatchSnapshot();
      });

      it('should generate many side of the connection', () => {
        const visitor = getVisitor(schema, 'task');
        const generatedCode = visitor.generate();
        expect(generatedCode).toMatchSnapshot();

        const metaDataVisitor = getVisitor(schema, 'task', CodeGenGenerateEnum.metadata);
        const generatedMetaData = metaDataVisitor.generate();
        expect(generatedMetaData).toMatchSnapshot();
      });
    });
  });

  it('should not covert Native types to List<type>', () => {
    const schema = /* GraphQL */ `
      enum EnumType {
        val1
        val2
      }
      type ObjectWithNativeTypes @model {
        intArr: [Int]
        strArr: [String]
        floatArr: [Float]
        boolArr: [Boolean]
        dateArr: [AWSDate]
        enumArr: [EnumType]
      }
    `;
    const visitor = getVisitor(schema, 'ObjectWithNativeTypes');
    const generatedCode = visitor.generate();
    expect(generatedCode).toMatchSnapshot();

    const metaDataVisitor = getVisitor(schema, 'ObjectWithNativeTypes', CodeGenGenerateEnum.metadata);
    const generatedMetaData = metaDataVisitor.generate();
    expect(generatedMetaData).toMatchSnapshot();
  });

  describe('reserved word escape', () => {
    it('should escape swift reserved keywords in enum values', () => {
      const schema = /* GraphQL */ `
        enum PostStatus {
          private
          public
        }
      `;
      const visitor = getVisitor(schema, 'PostStatus');
      const generatedCode = visitor.generate();

      expect(generatedCode).toMatchInlineSnapshot(`
        "// swiftlint:disable all
        import Amplify
        import Foundation

        public enum PostStatus: String {
          case \`private\`
          case \`public\`
        }"
      `);
    });

    it('should escape swift reserved keywords in enum name', () => {
      const schema = /* GraphQL */ `
        enum Class {
          private
          public
        }

        type Foo @model {
          Class: Class
          nonNullClass: Class!
          classes: [Class]
          nonNullClasses: [Class]!
        }
      `;
      const visitor = getVisitor(schema, 'Class');
      const generatedEnumCode = visitor.generate();
      expect(generatedEnumCode).toMatchInlineSnapshot(`
        "// swiftlint:disable all
        import Amplify
        import Foundation

        public enum \`Class\`: String {
          case \`private\`
          case \`public\`
        }"
      `);

      const fooVisitor = getVisitor(schema, 'Foo');
      const fooModel = fooVisitor.generate();
      expect(fooModel).toMatchInlineSnapshot(`
"// swiftlint:disable all
import Amplify
import Foundation

public struct Foo: Model {
  public let id: String
  public var \`Class\`: Class?
  public var nonNullClass: Class
  public var classes: [\`Class\`]?
  public var nonNullClasses: [\`Class\`]
  
  public init(id: String = UUID().uuidString,
      \`Class\`: \`Class\`? = nil,
      nonNullClass: \`Class\`,
      classes: [\`Class\`]? = [],
      nonNullClasses: [\`Class\`] = []) {
      self.id = id
      self.\`Class\` = \`Class\`
      self.nonNullClass = nonNullClass
      self.classes = classes
      self.nonNullClasses = nonNullClasses
  }
}"
`);
    });
  });
});
