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
            public var time: Temporal.Time?
            public var createdOn: Temporal.Date?
            
            public init(id: String = UUID().uuidString,
                title: String,
                done: Bool,
                todo: Todo? = nil,
                time: Temporal.Time? = nil,
                createdOn: Temporal.Date? = nil) {
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

    describe('connection with key directive', () => {
      it('should not throw error when connection has keyName', () => {
        const schema = /* GraphQL */ `
          type Post @model {
            id: ID!
            title: String!
            editors: [PostEditor] @connection(keyName: "byPost", fields: ["id"])
          }

          # Create a join model and disable queries as you don't need them
          # and can query through Post.editors and User.posts
          type PostEditor
            @model(queries: null)
            @key(name: "byPost", fields: ["postID", "editorID"])
            @key(name: "byEditor", fields: ["editorID", "postID"]) {
            id: ID!
            postID: ID!
            editorID: ID!
            post: Post! @connection(fields: ["postID"])
            editor: User! @connection(fields: ["editorID"])
          }

          type User @model {
            id: ID!
            username: String!
            posts: [PostEditor] @connection(keyName: "byEditor", fields: ["id"])
          }
        `;
        const postVisitor = getVisitor(schema, 'Post');
        expect(() => postVisitor.generate()).not.toThrowError();
      });

      it('should support connection directive with fields', () => {
        const schema = /* GraphQL */ `
          type Post @model {
            id: ID!
            title: String!
            editors: [PostEditor] @connection(fields: ["id"])
          }

          # Create a join model and disable queries as you don't need them
          # and can query through Post.editors and User.posts
          type PostEditor
            @model(queries: null)
            @key(name: "byPost", fields: ["postID", "editorID"])
            @key(name: "byEditor", fields: ["editorID", "postID"]) {
            id: ID!
            postID: ID!
            editorID: ID!
            post: Post! @connection(fields: ["postID"])
            editor: User! @connection(fields: ["editorID"])
          }

          type User @model {
            id: ID!
            username: String!
            posts: [PostEditor] @connection(fields: ["id"])
          }
        `;

        const postVisitor = getVisitor(schema, 'Post');
        expect(postVisitor.generate()).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          public struct Post: Model {
            public let id: String
            public var title: String
            public var editors: List<PostEditor>?
            
            public init(id: String = UUID().uuidString,
                title: String,
                editors: List<PostEditor>? = []) {
                self.id = id
                self.title = title
                self.editors = editors
            }
          }"
        `);

        const postSchemaVisitor = getVisitor(schema, 'Post', CodeGenGenerateEnum.metadata);
        expect(postSchemaVisitor.generate()).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          extension Post {
            // MARK: - CodingKeys 
             public enum CodingKeys: String, ModelKey {
              case id
              case title
              case editors
            }
            
            public static let keys = CodingKeys.self
            //  MARK: - ModelSchema 
            
            public static let schema = defineSchema { model in
              let post = Post.keys
              
              model.pluralName = \\"Posts\\"
              
              model.fields(
                .id(),
                .field(post.title, is: .required, ofType: .string),
                .hasMany(post.editors, is: .optional, ofType: PostEditor.self, associatedWith: PostEditor.keys.id)
              )
              }
          }"
        `);

        const postEditorVisitor = getVisitor(schema, 'Post');
        expect(postEditorVisitor.generate()).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          public struct Post: Model {
            public let id: String
            public var title: String
            public var editors: List<PostEditor>?
            
            public init(id: String = UUID().uuidString,
                title: String,
                editors: List<PostEditor>? = []) {
                self.id = id
                self.title = title
                self.editors = editors
            }
          }"
        `);

        const postEditorSchemaVisitor = getVisitor(schema, 'Post', CodeGenGenerateEnum.metadata);
        expect(postEditorSchemaVisitor.generate()).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          extension Post {
            // MARK: - CodingKeys 
             public enum CodingKeys: String, ModelKey {
              case id
              case title
              case editors
            }
            
            public static let keys = CodingKeys.self
            //  MARK: - ModelSchema 
            
            public static let schema = defineSchema { model in
              let post = Post.keys
              
              model.pluralName = \\"Posts\\"
              
              model.fields(
                .id(),
                .field(post.title, is: .required, ofType: .string),
                .hasMany(post.editors, is: .optional, ofType: PostEditor.self, associatedWith: PostEditor.keys.id)
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
        public var dateArr: [Temporal.Date]?
        public var enumArr: [EnumType]?
        
        public init(id: String = UUID().uuidString,
            intArr: [Int]? = [],
            strArr: [String]? = [],
            floatArr: [Double]? = [],
            boolArr: [Bool]? = [],
            dateArr: [Temporal.Date]? = [],
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
            .field(objectWithNativeTypes.intArr, is: .optional, ofType: .embeddedCollection(of: Int.self)),
            .field(objectWithNativeTypes.strArr, is: .optional, ofType: .embeddedCollection(of: String.self)),
            .field(objectWithNativeTypes.floatArr, is: .optional, ofType: .embeddedCollection(of: Double.self)),
            .field(objectWithNativeTypes.boolArr, is: .optional, ofType: .embeddedCollection(of: Bool.self)),
            .field(objectWithNativeTypes.dateArr, is: .optional, ofType: .embeddedCollection(of: Temporal.Date.self)),
            .field(objectWithNativeTypes.enumArr, is: .optional, ofType: .embeddedCollection(of: EnumType.self))
          )
          }
      }"
    `);
  });

  it('should support using embedded types in models', () => {
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
            .field(attraction.location, is: .required, ofType: .embedded(type: Location.self)),
            .field(attraction.nearByLocations, is: .optional, ofType: .embeddedCollection(of: Location.self)),
            .field(attraction.status, is: .required, ofType: .enum(type: Status.self)),
            .field(attraction.statusHistory, is: .optional, ofType: .embeddedCollection(of: Status.self)),
            .field(attraction.tags, is: .optional, ofType: .embeddedCollection(of: String.self))
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

      public struct Location: Embeddable {
        var lat: String
        var lang: String
        var tags: [String]?
      }"
    `);

    const visitorLocationSchema = getVisitor(schema, 'Location', CodeGenGenerateEnum.metadata);
    expect(visitorLocationSchema.generate()).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      extension Location {
        // MARK: - CodingKeys 
         public enum CodingKeys: String, ModelKey {
          case lat
          case lang
          case tags
        }
        
        public static let keys = CodingKeys.self
        //  MARK: - ModelSchema 
        
        public static let schema = defineSchema { model in
          let location = Location.keys
          
          model.pluralName = \\"Locations\\"
          
          model.fields(
            .field(location.lat, is: .required, ofType: .string),
            .field(location.lang, is: .required, ofType: .string),
            .field(location.tags, is: .optional, ofType: .embeddedCollection(of: String.self))
          )
          }
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
  describe('auth directives', () => {
    describe('owner auth', () => {
      it('should include authRules in schema when owner auth is used', () => {
        const schema = /* GraphQL */ `
          type Post @model @auth(rules: [{ allow: owner }]) {
            id: ID!
            title: String!
            owner: String!
          }
        `;
        const visitor = getVisitor(schema, 'Post', CodeGenGenerateEnum.metadata);
        const generatedCode = visitor.generate();
        expect(generatedCode).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          extension Post {
            // MARK: - CodingKeys 
             public enum CodingKeys: String, ModelKey {
              case id
              case title
              case owner
            }
            
            public static let keys = CodingKeys.self
            //  MARK: - ModelSchema 
            
            public static let schema = defineSchema { model in
              let post = Post.keys
              
              model.authRules = [
                rule(allow: .owner, ownerField: \\"owner\\", identityClaim: \\"cognito:username\\", operations: [.create, .update, .delete, .read])
              ]
              
              model.pluralName = \\"Posts\\"
              
              model.fields(
                .id(),
                .field(post.title, is: .required, ofType: .string),
                .field(post.owner, is: .required, ofType: .string)
              )
              }
          }"
        `);
      });

      it('should include authRules in schema when owner auth is used', () => {
        const schema = /* GraphQL */ `
          type Post @model @auth(rules: [{ allow: owner, ownerField: "author" }]) {
            id: ID!
            title: String!
            author: String!
          }
        `;
        const visitor = getVisitor(schema, 'Post', CodeGenGenerateEnum.metadata);
        const generatedCode = visitor.generate();
        expect(generatedCode).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          extension Post {
            // MARK: - CodingKeys 
             public enum CodingKeys: String, ModelKey {
              case id
              case title
              case author
            }
            
            public static let keys = CodingKeys.self
            //  MARK: - ModelSchema 
            
            public static let schema = defineSchema { model in
              let post = Post.keys
              
              model.authRules = [
                rule(allow: .owner, ownerField: \\"author\\", identityClaim: \\"cognito:username\\", operations: [.create, .update, .delete, .read])
              ]
              
              model.pluralName = \\"Posts\\"
              
              model.fields(
                .id(),
                .field(post.title, is: .required, ofType: .string),
                .field(post.author, is: .required, ofType: .string)
              )
              }
          }"
        `);
      });

      it('should support changing allowed operation', () => {
        const schema = /* GraphQL */ `
          type Post @model @auth(rules: [{ allow: owner, ownerField: "author", operations: ["create", "update", "delete"] }]) {
            id: ID!
            title: String!
            author: String!
          }
        `;

        const visitor = getVisitor(schema, 'Post', CodeGenGenerateEnum.metadata);
        const generatedCode = visitor.generate();
        expect(generatedCode).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          extension Post {
            // MARK: - CodingKeys 
             public enum CodingKeys: String, ModelKey {
              case id
              case title
              case author
            }
            
            public static let keys = CodingKeys.self
            //  MARK: - ModelSchema 
            
            public static let schema = defineSchema { model in
              let post = Post.keys
              
              model.authRules = [
                rule(allow: .owner, ownerField: \\"author\\", identityClaim: \\"cognito:username\\", operations: [.create, .update, .delete])
              ]
              
              model.pluralName = \\"Posts\\"
              
              model.fields(
                .id(),
                .field(post.title, is: .required, ofType: .string),
                .field(post.author, is: .required, ofType: .string)
              )
              }
          }"
        `);
      });

      it('should support changing identityClaim ', () => {
        const schema = /* GraphQL */ `
          type Post @model @auth(rules: [{ allow: owner, ownerField: "author", identityClaim: "sub" }]) {
            id: ID!
            title: String!
            author: String!
          }
        `;

        const visitor = getVisitor(schema, 'Post', CodeGenGenerateEnum.metadata);
        const generatedCode = visitor.generate();
        expect(generatedCode).toMatchInlineSnapshot(`
          "// swiftlint:disable all
          import Amplify
          import Foundation

          extension Post {
            // MARK: - CodingKeys 
             public enum CodingKeys: String, ModelKey {
              case id
              case title
              case author
            }
            
            public static let keys = CodingKeys.self
            //  MARK: - ModelSchema 
            
            public static let schema = defineSchema { model in
              let post = Post.keys
              
              model.authRules = [
                rule(allow: .owner, ownerField: \\"author\\", identityClaim: \\"sub\\", operations: [.create, .update, .delete, .read])
              ]
              
              model.pluralName = \\"Posts\\"
              
              model.fields(
                .id(),
                .field(post.title, is: .required, ofType: .string),
                .field(post.author, is: .required, ofType: .string)
              )
              }
          }"
        `);
      });
    });
  });

  describe('group auth', () => {
    it('should include authRules in schema when static groups auth is used', () => {
      const schema = /* GraphQL */ `
        type Post @model @auth(rules: [{ allow: groups, groups: ["admin", "editors"] }]) {
          id: ID!
          title: String!
        }
      `;
      const visitor = getVisitor(schema, 'Post', CodeGenGenerateEnum.metadata);
      const generatedCode = visitor.generate();
      expect(generatedCode).toMatchInlineSnapshot(`
        "// swiftlint:disable all
        import Amplify
        import Foundation

        extension Post {
          // MARK: - CodingKeys 
           public enum CodingKeys: String, ModelKey {
            case id
            case title
          }
          
          public static let keys = CodingKeys.self
          //  MARK: - ModelSchema 
          
          public static let schema = defineSchema { model in
            let post = Post.keys
            
            model.authRules = [
              rule(allow: .groups, groupClaim: \\"cognito:groups\\", groups: [\\"admin\\", \\"editors\\"], operations: [.create, .update, .delete, .read])
            ]
            
            model.pluralName = \\"Posts\\"
            
            model.fields(
              .id(),
              .field(post.title, is: .required, ofType: .string)
            )
            }
        }"
      `);
    });

    it('should include authRules in schema when dynamoc auth is used', () => {
      const schema = /* GraphQL */ `
        type Post @model @auth(rules: [{ allow: groups, groupsField: "groups" }]) {
          id: ID!
          title: String!
          groups: [String!]!
        }
      `;
      const visitor = getVisitor(schema, 'Post', CodeGenGenerateEnum.metadata);
      const generatedCode = visitor.generate();
      expect(generatedCode).toMatchInlineSnapshot(`
        "// swiftlint:disable all
        import Amplify
        import Foundation

        extension Post {
          // MARK: - CodingKeys 
           public enum CodingKeys: String, ModelKey {
            case id
            case title
            case groups
          }
          
          public static let keys = CodingKeys.self
          //  MARK: - ModelSchema 
          
          public static let schema = defineSchema { model in
            let post = Post.keys
            
            model.authRules = [
              rule(allow: .groups, groupClaim: \\"cognito:groups\\", groupsField: \\"groups\\", operations: [.create, .update, .delete, .read])
            ]
            
            model.pluralName = \\"Posts\\"
            
            model.fields(
              .id(),
              .field(post.title, is: .required, ofType: .string),
              .field(post.groups, is: .required, ofType: .embeddedCollection(of: String.self))
            )
            }
        }"
      `);
    });

    it('should support changing allowed operation', () => {
      const schema = /* GraphQL */ `
        type Post @model @auth(rules: [{ allow: groups, groups: ["admin"], operations: ["create", "update", "delete"] }]) {
          id: ID!
          title: String!
        }
      `;

      const visitor = getVisitor(schema, 'Post', CodeGenGenerateEnum.metadata);
      const generatedCode = visitor.generate();
      expect(generatedCode).toMatchInlineSnapshot(`
        "// swiftlint:disable all
        import Amplify
        import Foundation

        extension Post {
          // MARK: - CodingKeys 
           public enum CodingKeys: String, ModelKey {
            case id
            case title
          }
          
          public static let keys = CodingKeys.self
          //  MARK: - ModelSchema 
          
          public static let schema = defineSchema { model in
            let post = Post.keys
            
            model.authRules = [
              rule(allow: .groups, groupClaim: \\"cognito:groups\\", groups: [\\"admin\\"], operations: [.create, .update, .delete])
            ]
            
            model.pluralName = \\"Posts\\"
            
            model.fields(
              .id(),
              .field(post.title, is: .required, ofType: .string)
            )
            }
        }"
      `);
    });

    it('should support changing groupsClaim ', () => {
      const schema = /* GraphQL */ `
        type Post @model @auth(rules: [{ allow: groups, groups: ["admin"], groupClaim: "custom:groups" }]) {
          id: ID!
          title: String!
        }
      `;

      const visitor = getVisitor(schema, 'Post', CodeGenGenerateEnum.metadata);
      const generatedCode = visitor.generate();
      expect(generatedCode).toMatchInlineSnapshot(`
        "// swiftlint:disable all
        import Amplify
        import Foundation

        extension Post {
          // MARK: - CodingKeys 
           public enum CodingKeys: String, ModelKey {
            case id
            case title
          }
          
          public static let keys = CodingKeys.self
          //  MARK: - ModelSchema 
          
          public static let schema = defineSchema { model in
            let post = Post.keys
            
            model.authRules = [
              rule(allow: .groups, groupClaim: \\"custom:groups\\", groups: [\\"admin\\"], operations: [.create, .update, .delete, .read])
            ]
            
            model.pluralName = \\"Posts\\"
            
            model.fields(
              .id(),
              .field(post.title, is: .required, ofType: .string)
            )
            }
        }"
      `);
    });
  });
  it('should support multiple auth rules', () => {
    const schema = /* GraphQL */ `
      type Post
        @model
        @auth(
          rules: [
            { allow: groups, groups: ["admin"] }
            { allow: owner, operations: ["create", "update"] }
            { allow: public, operation: ["read"] }
          ]
        ) {
        id: ID!
        title: String!
        owner: String!
      }
    `;

    const visitor = getVisitor(schema, 'Post', CodeGenGenerateEnum.metadata);
    const generatedCode = visitor.generate();
    expect(generatedCode).toMatchInlineSnapshot(`
      "// swiftlint:disable all
      import Amplify
      import Foundation

      extension Post {
        // MARK: - CodingKeys 
         public enum CodingKeys: String, ModelKey {
          case id
          case title
          case owner
        }
        
        public static let keys = CodingKeys.self
        //  MARK: - ModelSchema 
        
        public static let schema = defineSchema { model in
          let post = Post.keys
          
          model.authRules = [
            rule(allow: .groups, groupClaim: \\"cognito:groups\\", groups: [\\"admin\\"], operations: [.create, .update, .delete, .read]),
            rule(allow: .owner, ownerField: \\"owner\\", identityClaim: \\"cognito:username\\", operations: [.create, .update])
          ]
          
          model.pluralName = \\"Posts\\"
          
          model.fields(
            .id(),
            .field(post.title, is: .required, ofType: .string),
            .field(post.owner, is: .required, ofType: .string)
          )
          }
      }"
    `);
  });
});
