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
    { directives, target: 'swift', scalars: SWIFT_SCALAR_MAP },
    { selectedType, generate },
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
    expect(generatedCode).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      public struct SimpleModel: Model {
        public let id: String
        public var name: String?
        public var bar: String?
        
        public init(id: String = UUID().uuidString,
            name: String? = nil,
            bar: String? = nil) {
            self.id = id
            self.name = name
            self.bar = bar
        }
      }"
    `);
    const metadataVisitor = getVisitor(schema, 'SimpleModel', CodeGenGenerateEnum.metadata);
    const generatedMetadata = metadataVisitor.generate();
    expect(generatedMetadata).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      extension SimpleModel {
        // MARK: - CodingKeys 
         public enum CodingKeys: String, ModelKey {
          case id
          case name
          case bar
        }
        
        public static let keys = CodingKeys.self
        //  MARK: - ModelSchema 
        
        public static let schema = defineSchema { model in
          let simpleModel = SimpleModel.keys
          
          model.pluralName = \\"SimpleModels\\"
          
          model.fields(
            .id(),
            .field(simpleModel.name, is: .optional, ofType: .string),
            .field(simpleModel.bar, is: .optional, ofType: .string)
          )
          }
      }"
    `);
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
    expect(generatedCode).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      public enum Status: String, EnumPersistable {
        case pending
        case done
      }"
    `);
    const metadataVisitor = getVisitor(schema, 'status', CodeGenGenerateEnum.metadata);
    const generatedMetadata = metadataVisitor.generate();
    expect(generatedMetadata).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation
      "
    `);
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
    expect(generatedCode).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      public struct snake_case: Model {
        public let id: String
        public var name: String?
        
        public init(id: String = UUID().uuidString,
            name: String? = nil) {
            self.id = id
            self.name = name
        }
      }"
    `);

    const metadataVisitor = getVisitor(schema, 'snake_case', CodeGenGenerateEnum.metadata);
    const generatedMetadata = metadataVisitor.generate();
    expect(generatedMetadata).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      extension snake_case {
        // MARK: - CodingKeys 
         public enum CodingKeys: String, ModelKey {
          case id
          case name
        }
        
        public static let keys = CodingKeys.self
        //  MARK: - ModelSchema 
        
        public static let schema = defineSchema { model in
          let snake_case = snake_case.keys
          
          model.pluralName = \\"snake_cases\\"
          
          model.fields(
            .id(),
            .field(snake_case.name, is: .optional, ofType: .string)
          )
          }
      }"
    `);
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
    expect(generatedCode).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      public struct SnakeCaseField: Model {
        public let id: String
        public var first_name: String?
        
        public init(id: String = UUID().uuidString,
            first_name: String? = nil) {
            self.id = id
            self.first_name = first_name
        }
      }"
    `);
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
    expect(generatedCode).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      public struct authorBook: Model {
        public let id: String
        public var author_id: String
        public var book_id: String
        public var author: String?
        public var book: String?
        
        public init(id: String = UUID().uuidString,
            author_id: String,
            book_id: String,
            author: String? = nil,
            book: String? = nil) {
            self.id = id
            self.author_id = author_id
            self.book_id = book_id
            self.author = author
            self.book = book
        }
      }"
    `);

    const metadataVisitor = getVisitor(schema, 'authorBook', CodeGenGenerateEnum.metadata);
    const generatedMetadata = metadataVisitor.generate();
    expect(generatedMetadata).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      extension authorBook {
        // MARK: - CodingKeys 
         public enum CodingKeys: String, ModelKey {
          case id
          case author_id
          case book_id
          case author
          case book
        }
        
        public static let keys = CodingKeys.self
        //  MARK: - ModelSchema 
        
        public static let schema = defineSchema { model in
          let authorBook = authorBook.keys
          
          model.pluralName = \\"authorBooks\\"
          
          model.fields(
            .id(),
            .field(authorBook.author_id, is: .required, ofType: .string),
            .field(authorBook.book_id, is: .required, ofType: .string),
            .field(authorBook.author, is: .optional, ofType: .string),
            .field(authorBook.book, is: .optional, ofType: .string)
          )
          }
      }"
    `);
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
        expect(generatedCode).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          public struct Todo: Model {
            public let id: String
            public var title: String
            public var done: Bool
            public var description: String?
            public var due_date: String?
            public var version: Int
            public var value: Double?
            public var tasks: List<task>?
            
            public init(id: String = UUID().uuidString,
                title: String,
                done: Bool,
                description: String? = nil,
                due_date: String? = nil,
                version: Int,
                value: Double? = nil,
                tasks: List<task>? = []) {
                self.id = id
                self.title = title
                self.done = done
                self.description = description
                self.due_date = due_date
                self.version = version
                self.value = value
                self.tasks = tasks
            }
          }"
        `);

        const metadataVisitor = getVisitor(schema, 'Todo', CodeGenGenerateEnum.metadata);
        const generatedMetadata = metadataVisitor.generate();
        expect(generatedMetadata).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          extension Todo {
            // MARK: - CodingKeys 
             public enum CodingKeys: String, ModelKey {
              case id
              case title
              case done
              case description
              case due_date
              case version
              case value
              case tasks
            }
            
            public static let keys = CodingKeys.self
            //  MARK: - ModelSchema 
            
            public static let schema = defineSchema { model in
              let todo = Todo.keys
              
              model.pluralName = \\"Todos\\"
              
              model.fields(
                .id(),
                .field(todo.title, is: .required, ofType: .string),
                .field(todo.done, is: .required, ofType: .bool),
                .field(todo.description, is: .optional, ofType: .string),
                .field(todo.due_date, is: .optional, ofType: .string),
                .field(todo.version, is: .required, ofType: .int),
                .field(todo.value, is: .optional, ofType: .double),
                .hasMany(todo.tasks, is: .optional, ofType: task.self, associatedWith: task.keys.todo)
              )
              }
          }"
        `);
      });

      it('should generate many side of the connection', () => {
        const visitor = getVisitor(schema, 'task');
        const generatedCode = visitor.generate();
        expect(generatedCode).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          public struct task: Model {
            public let id: String
            public var title: String
            public var done: Bool
            public var todo: Todo?
            public var time: Date?
            public var createdOn: Date?
            
            public init(id: String = UUID().uuidString,
                title: String,
                done: Bool,
                todo: Todo? = nil,
                time: Date? = nil,
                createdOn: Date? = nil) {
                self.id = id
                self.title = title
                self.done = done
                self.todo = todo
                self.time = time
                self.createdOn = createdOn
            }
          }"
        `);

        const metadataVisitor = getVisitor(schema, 'task', CodeGenGenerateEnum.metadata);
        const generatedMetadata = metadataVisitor.generate();
        expect(generatedMetadata).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          extension task {
            // MARK: - CodingKeys 
             public enum CodingKeys: String, ModelKey {
              case id
              case title
              case done
              case todo
              case time
              case createdOn
            }
            
            public static let keys = CodingKeys.self
            //  MARK: - ModelSchema 
            
            public static let schema = defineSchema { model in
              let task = task.keys
              
              model.pluralName = \\"tasks\\"
              
              model.fields(
                .id(),
                .field(task.title, is: .required, ofType: .string),
                .field(task.done, is: .required, ofType: .bool),
                .belongsTo(task.todo, is: .optional, ofType: Todo.self, targetName: \\"taskTodoId\\"),
                .field(task.time, is: .optional, ofType: .time),
                .field(task.createdOn, is: .optional, ofType: .date)
              )
              }
          }"
        `);
      });
    });
  });

  it('should not convert non model type to List<type>', () => {
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
    expect(generatedCode).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      public struct ObjectWithNativeTypes: Model {
        public let id: String
        public var intArr: [Int]?
        public var strArr: [String]?
        public var floatArr: [Double]?
        public var boolArr: [Bool]?
        public var dateArr: [Date]?
        public var enumArr: [EnumType]?
        
        public init(id: String = UUID().uuidString,
            intArr: [Int]? = [],
            strArr: [String]? = [],
            floatArr: [Double]? = [],
            boolArr: [Bool]? = [],
            dateArr: [Date]? = [],
            enumArr: [EnumType]? = []) {
            self.id = id
            self.intArr = intArr
            self.strArr = strArr
            self.floatArr = floatArr
            self.boolArr = boolArr
            self.dateArr = dateArr
            self.enumArr = enumArr
        }
      }"
    `);

    const metadataVisitor = getVisitor(schema, 'ObjectWithNativeTypes', CodeGenGenerateEnum.metadata);
    const generatedMetadata = metadataVisitor.generate();
    expect(generatedMetadata).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      extension ObjectWithNativeTypes {
        // MARK: - CodingKeys 
         public enum CodingKeys: String, ModelKey {
          case id
          case intArr
          case strArr
          case floatArr
          case boolArr
          case dateArr
          case enumArr
        }
        
        public static let keys = CodingKeys.self
        //  MARK: - ModelSchema 
        
        public static let schema = defineSchema { model in
          let objectWithNativeTypes = ObjectWithNativeTypes.keys
          
          model.pluralName = \\"ObjectWithNativeTypes\\"
          
          model.fields(
            .id(),
            .field(objectWithNativeTypes.intArr, is: .optional, ofType: .customType([Int].self)),
            .field(objectWithNativeTypes.strArr, is: .optional, ofType: .customType([String].self)),
            .field(objectWithNativeTypes.floatArr, is: .optional, ofType: .customType([Double].self)),
            .field(objectWithNativeTypes.boolArr, is: .optional, ofType: .customType([Bool].self)),
            .field(objectWithNativeTypes.dateArr, is: .optional, ofType: .customType([Date].self)),
            .field(objectWithNativeTypes.enumArr, is: .optional, ofType: .customType([EnumType].self))
          )
          }
      }"
    `);
  });

  it('should support using non model types in models', () => {
    const schema = /* GraphQL */ `
      type Attraction @model {
        id: ID!
        name: String!
        location: Location!
        nearByLocations: [Location]
        status: Status!
        statusHistory: [Status]
        tags: [String]
      }
      enum Status {
        public
        private
      }
      type Location {
        lat: String!
        lang: String!
        tags: [String]
      }
    `;
    const visitorAttraction = getVisitor(schema, 'Attraction');
    const generatedAttractionCode = visitorAttraction.generate();
    expect(generatedAttractionCode).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      public struct Attraction: Model {
        public let id: String
        public var name: String
        public var location: Location
        public var nearByLocations: [Location]?
        public var status: Status
        public var statusHistory: [Status]?
        public var tags: [String]?
        
        public init(id: String = UUID().uuidString,
            name: String,
            location: Location,
            nearByLocations: [Location]? = [],
            status: Status,
            statusHistory: [Status]? = [],
            tags: [String]? = []) {
            self.id = id
            self.name = name
            self.location = location
            self.nearByLocations = nearByLocations
            self.status = status
            self.statusHistory = statusHistory
            self.tags = tags
        }
      }"
    `);

    const visitorAttractionSchema = getVisitor(schema, 'Attraction', CodeGenGenerateEnum.metadata);
    expect(visitorAttractionSchema.generate()).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      extension Attraction {
        // MARK: - CodingKeys 
         public enum CodingKeys: String, ModelKey {
          case id
          case name
          case location
          case nearByLocations
          case status
          case statusHistory
          case tags
        }
        
        public static let keys = CodingKeys.self
        //  MARK: - ModelSchema 
        
        public static let schema = defineSchema { model in
          let attraction = Attraction.keys
          
          model.pluralName = \\"Attractions\\"
          
          model.fields(
            .id(),
            .field(attraction.name, is: .required, ofType: .string),
            .field(attraction.location, is: .required, ofType: .customType(Location.self)),
            .field(attraction.nearByLocations, is: .optional, ofType: .customType([Location].self)),
            .field(attraction.status, is: .required, ofType: .enum(type: Status.self)),
            .field(attraction.statusHistory, is: .optional, ofType: .customType([Status].self)),
            .field(attraction.tags, is: .optional, ofType: .customType([String].self))
          )
          }
      }"
    `);

    const visitorStatusCode = getVisitor(schema, 'Status', CodeGenGenerateEnum.code);
    expect(visitorStatusCode.generate()).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      public enum Status: String, EnumPersistable {
        case \`public\`
        case \`private\`
      }"
    `);

    const visitorLocationCode = getVisitor(schema, 'Location', CodeGenGenerateEnum.code);
    expect(visitorLocationCode.generate()).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      public struct Location: Codable {
        var lat: String
        var lang: String
        var tags: [String]?
      }"
    `);

    const visitorClassLoader = getVisitor(schema, undefined, CodeGenGenerateEnum.loader);
    expect(visitorClassLoader.generate()).toMatchInlineSnapshot(`
"// swiftlint:disable all
import Amplify
import Foundation

// Contains the set of classes that conforms to the \`Model\` protocol. 

final public class AmplifyModels: AmplifyModelRegistration {
  public let version: String = \\"ca73d7dc63498f675fff2b260548d216\\"
  
  public func registerModels(registry: ModelRegistry.Type) {
    ModelRegistry.register(modelType: Attraction.self)
  }
}"
`);
  });

  it('should escape swift reserved keywords in enum', () => {
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

public enum PostStatus: String, EnumPersistable {
  case \`private\`
  case \`public\`
}"
`);
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

public enum PostStatus: String, EnumPersistable {
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

public enum \`Class\`: String, EnumPersistable {
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
