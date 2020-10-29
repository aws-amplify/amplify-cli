import { buildSchema, GraphQLSchema, parse, visit } from 'graphql';
import { validateJava } from '../utils/validate-java';
import { directives, scalars } from '../../scalars/supported-directives';
import { AppSyncModelJavaVisitor } from '../../visitors/appsync-java-visitor';
import { CodeGenGenerateEnum } from '../../visitors/appsync-visitor';
import { JAVA_SCALAR_MAP } from '../../scalars';

const buildSchemaWithDirectives = (schema: String): GraphQLSchema => {
  return buildSchema([schema, directives, scalars].join('\n'));
};

const getVisitor = (schema: string, selectedType?: string, generate: CodeGenGenerateEnum = CodeGenGenerateEnum.code) => {
  const ast = parse(schema);
  const builtSchema = buildSchemaWithDirectives(schema);
  const visitor = new AppSyncModelJavaVisitor(
    builtSchema,
    { directives, target: 'android', generate, scalars: JAVA_SCALAR_MAP },
    { selectedType },
  );
  visit(ast, { leave: visitor });
  return visitor;
};

describe('AppSyncModelVisitor', () => {
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

    enum status {
      pending
      done
    }

    type task @model {
      id: ID
      title: String!
      done: Boolean!
      status: status
      todo: Todo @connection(name: "TodoTasks")
      time: AWSTime
      createdOn: AWSDate
    }

    type authorBook @model @key(name: "byAuthor", fields: ["author_id"]) @key(name: "byBook", fields: ["book_id"]) {
      id: ID!
      author_id: ID!
      book_id: ID!
      author: Author @connection(fields: ["author_id"])
      book: Book @connection(fields: ["book_id"])
    }

    type Book @model {
      id: ID!
      title: String!
      authors: [authorBook] @connection(keyName: "byBook", fields: ["id"])
    }

    type Author @model {
      id: ID!
      first_name: String!
      last_name: String!
      books: [authorBook] @connection(keyName: "byAuthor", fields: ["id"])
    }

    type Foo @model {
      name: String
      bar: String
    }
  `;

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
    expect(() => validateJava(generatedCode)).not.toThrow();
    expect(generatedCode).toMatchSnapshot();
    expect(generatedCode).toMatchSnapshot();
  });

  it('Should generate a class a model with all optional fields', () => {
    const schema = /* GraphQL */ `
      type SimpleModel @model {
        name: String
        bar: String
      }
    `;

    const visitor = getVisitor(schema);
    const generatedCode = visitor.generate();
    expect(() => validateJava(generatedCode)).not.toThrow();
    expect(generatedCode).toMatchSnapshot();
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
    expect(() => validateJava(generatedCode)).not.toThrow();
    expect(generatedCode).toMatchSnapshot();
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
    expect(() => validateJava(generatedCode)).not.toThrow();
    expect(generatedCode).toMatchSnapshot();
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
    expect(() => validateJava(generatedCode)).not.toThrow();
    expect(generatedCode).toMatchSnapshot();
  });

  it('should generate model with non-camel case field', () => {
    const schema = /* GraphQL */ `
      type NonCamelCaseField @model {
        id: ID!
        employeePID: String
      }
    `;
    const visitor = getVisitor(schema, 'NonCamelCaseField');
    const generatedCode = visitor.generate();
    expect(() => validateJava(generatedCode)).not.toThrow();
    expect(generatedCode).toMatchSnapshot();
  });

  it('should throw error if two fields have the same camel field', () => {
    const schema = /* GraphQL */ `
      type sameCamelCaseField @model {
        id: ID!
        subjectName: String
        subject_name: String
      }
    `;
    const visitor = getVisitor(schema, 'sameCamelCaseField');
    expect(visitor.generate).toThrowErrorMatchingSnapshot();
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
    expect(() => validateJava(generatedCode)).not.toThrow();
    expect(generatedCode).toMatchSnapshot();
  });

  describe('Model with Auth', () => {
    it('should generate class with owner auth', () => {
      const schema = /* GraphQL */ `
        type simpleOwnerAuth @model @auth(rules: [{ allow: owner }]) {
          id: ID!
          name: String
          bar: String
        }
      `;
      const visitor = getVisitor(schema, 'simpleOwnerAuth');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });

    it('should generate class with owner auth allowing others to read', () => {
      const schema = /* GraphQL */ `
        type allowRead @model @auth(rules: [{ allow: owner, operations: [create, delete, update] }]) {
          id: ID!
          name: String
          bar: String
        }
      `;
      const visitor = getVisitor(schema, 'allowRead');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });

    it('should generate class with static groups', () => {
      const schema = /* GraphQL */ `
        type staticGroups @model @auth(rules: [{ allow: groups, groups: ["Admin"] }]) {
          id: ID!
          name: String
          bar: String
        }
      `;
      const visitor = getVisitor(schema, 'staticGroups');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });

    it('should generate class with dynamic groups', () => {
      const schema = /* GraphQL */ `
        type dynamicGroups @model @auth(rules: [{ allow: groups, groupsField: "groups" }]) {
          id: ID!
          name: String
          bar: String
        }
      `;
      const visitor = getVisitor(schema, 'dynamicGroups');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });

    it('should generate class with public authorization', () => {
      const schema = /* GraphQL */ `
        type publicType @model @auth(rules: [{ allow: public }]) {
          id: ID!
          name: String
          bar: String
        }
      `;
      const visitor = getVisitor(schema, 'publicType');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });

    it('should generate class with private authorization', () => {
      const schema = /* GraphQL */ `
        type privateType @model @auth(rules: [{ allow: private }]) {
          id: ID!
          name: String
          bar: String
        }
      `;
      const visitor = getVisitor(schema, 'privateType');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });

    it('should generate class with default field auth', () => {
      const schema = /* GraphQL */ `
        type Employee @model
        @auth(rules: [
            { allow: owner },
            { allow: groups, groups: ["Admins"] }
        ]) {
          id: ID!
          name: String!
          address: String!
          ssn: String @auth(rules: [{allow: owner}])
        }
      `;
      const visitor = getVisitor(schema, 'Employee');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });

    it('should generate class with private authorization and field auth', () => {
      const schema = /* GraphQL */ `
        type privateType @model @auth(rules: [{ allow: private }]) {
          id: ID!
          name: String
          bar: String @auth(rules: [{ allow: private, operations: [create, update] }])
        }
      `;
      const visitor = getVisitor(schema, 'privateType');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });

    it('should generate class with custom claims', () => {
      const schema = /* GraphQL */ `
        type customClaim @model @auth(rules: [{ allow: owner, identityClaim: "user_id" }]) {
          id: ID!
          name: String
          bar: String
        }
      `;
      const visitor = getVisitor(schema, 'customClaim');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });

    it('should generate class with custom group claims', () => {
      const schema = /* GraphQL */ `
        type customClaim @model @auth(rules: [{ allow: groups, groups: ["Moderator"], groupClaim: "user_groups" }]) {
          id: ID!
          name: String
          bar: String
        }
      `;
      const visitor = getVisitor(schema, 'customClaim');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });
  });

  describe('Non model type', () => {
    const schema = /* GraphQL */ `
      type Landmark @model {
        id: ID!
        name: String!
        rating: Int!
        location: Location!
        parking: Location
      }
      type Location {
        lat: String!
        lang: String!
      }
    `;
    it('should generate class for non model types', () => {
      const visitor = getVisitor(schema, 'Location');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });
    it('should generate class for model types with non model fields', () => {
      const visitor = getVisitor(schema, 'Landmark');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });
  });

  it('should generate Temporal type for AWSDate* scalars', () => {
    const schema = /* GraphQL */ `
      type TypeWithAWSDateScalars @model {
        id: ID!
        date: AWSDate
        createdAt: AWSDateTime
        time: AWSTime
        timestamp: AWSTimestamp
      }
    `;
    const visitor = getVisitor(schema, 'TypeWithAWSDateScalars');
    const generatedCode = visitor.generate();
    expect(() => validateJava(generatedCode)).not.toThrow();
    expect(generatedCode).toMatchSnapshot();
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
        expect(() => validateJava(generatedCode)).not.toThrow();
        expect(generatedCode).toMatchSnapshot();
      });

      it('should generate many side of the connection', () => {
        const visitor = getVisitor(schema, 'task');
        const generatedCode = visitor.generate();
        expect(() => validateJava(generatedCode)).not.toThrow();
        expect(generatedCode).toMatchSnapshot();
      });
    });
  });

  describe('One to Many connection with no nullable and non nullable fields', () => {
    const schema = /* GraphQL */ `
      type Todo @model {
        id: ID!
        tasks: [task] @connection(name: "TodoTasks")
      }

      type task @model {
        id: ID
        todo: Todo @connection(name: "TodoTasks")
        time: AWSTime
        createdOn: AWSDate
      }
    `;
    it('should generate class for one side of the connection', () => {
      const visitor = getVisitor(schema, 'Todo');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });

    it('should generate class for many side of the connection', () => {
      const visitor = getVisitor(schema, 'task');
      const generatedCode = visitor.generate();
      expect(() => validateJava(generatedCode)).not.toThrow();
      expect(generatedCode).toMatchSnapshot();
    });
  });
});
