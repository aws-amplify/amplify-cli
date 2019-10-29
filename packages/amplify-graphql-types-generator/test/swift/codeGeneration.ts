import { parse, GraphQLNonNull, GraphQLString, GraphQLEnumType, GraphQLList } from 'graphql';

import { loadSchema } from '../../src/loading';
const schema = loadSchema(require.resolve('../fixtures/starwars/schema.json'));

import { compileToIR, CompilerOptions, CompilerContext, SelectionSet, Field, Argument } from '../../src/compiler';

import { SwiftAPIGenerator } from '../../src/swift/codeGeneration';

describe('Swift code generation', () => {
  let generator: SwiftAPIGenerator;

  beforeEach(() => {
    generator = new SwiftAPIGenerator({});
  });

  function compile(source: string, options: CompilerOptions = { mergeInFieldsFromFragmentSpreads: true }): CompilerContext {
    const document = parse(source);
    const context = compileToIR(schema, document, options);
    generator.context = context;
    return context;
  }

  describe('#classDeclarationForOperation()', () => {
    it(`should generate a class declaration for a query with variables`, () => {
      const { operations } = compile(`
        query HeroName($episode: Episode) {
          hero(episode: $episode) {
            name
          }
        }
      `);

      generator.classDeclarationForOperation(operations['HeroName']);

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a class declaration for a query with fragment spreads`, () => {
      const { operations } = compile(`
        query Hero {
          hero {
            ...HeroDetails
          }
        }

        fragment HeroDetails on Character {
          name
        }
      `);

      generator.classDeclarationForOperation(operations['Hero']);

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a class declaration for a query with conditional fragment spreads`, () => {
      const { operations } = compile(`
        query Hero {
          hero {
            ...DroidDetails
          }
        }

        fragment DroidDetails on Droid {
          primaryFunction
        }
      `);

      generator.classDeclarationForOperation(operations['Hero']);

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a class declaration for a query with a fragment spread nested in an inline fragment`, () => {
      const { operations } = compile(`
        query Hero {
          hero {
            ... on Droid {
              ...HeroDetails
            }
          }
        }

        fragment HeroDetails on Character {
          name
        }
      `);

      generator.classDeclarationForOperation(operations['Hero']);

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a class declaration for a mutation with variables`, () => {
      const { operations } = compile(`
        mutation CreateReview($episode: Episode) {
          createReview(episode: $episode, review: { stars: 5, commentary: "Wow!" }) {
            stars
            commentary
          }
        }
      `);

      generator.classDeclarationForOperation(operations['CreateReview']);

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a class declaration with an operationIdentifier property when generateOperationIds is specified`, () => {
      const { operations } = compile(
        `
        query Hero {
          hero {
            ...HeroDetails
          }
        }
        fragment HeroDetails on Character {
          name
        }
      `,
        { generateOperationIds: true, mergeInFieldsFromFragmentSpreads: true }
      );

      generator.classDeclarationForOperation(operations['Hero']);

      expect(generator.output).toMatchSnapshot();
    });
  });

  describe('#initializerDeclarationForProperties()', () => {
    it(`should generate initializer for a property`, () => {
      generator.initializerDeclarationForProperties([{ propertyName: 'episode', typeName: 'Episode' }]);

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate initializer for an optional property`, () => {
      generator.initializerDeclarationForProperties([{ propertyName: 'episode', typeName: 'Episode?', isOptional: true }]);

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate initializer for multiple properties`, () => {
      generator.initializerDeclarationForProperties([
        { propertyName: 'episode', typeName: 'Episode?', isOptional: true },
        { propertyName: 'scene', typeName: 'String?', isOptional: true },
      ]);

      expect(generator.output).toMatchSnapshot();
    });
  });

  describe('#propertyAssignmentForField()', () => {
    it('should generate expression for nullable scalar', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: GraphQLString,
        })
      ).toBe('"response_key": propertyName');
    });

    it('should generate expression for non-null scalar', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: new GraphQLNonNull(GraphQLString),
        })
      ).toBe('"response_key": propertyName');
    });

    it('should generate expression for nullable list of nullable scalars', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: new GraphQLList(GraphQLString),
        })
      ).toBe('"response_key": propertyName');
    });

    it('should generate expression for nullable list of non-null scalars', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
        })
      ).toBe('"response_key": propertyName');
    });

    it('should generate expression for non-null list of nullable scalars', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
        })
      ).toBe('"response_key": propertyName');
    });

    it('should generate expression for non-null list of non-null scalars', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
        })
      ).toBe('"response_key": propertyName');
    });

    it('should generate expression for nullable composite', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: schema.getType('Droid'),
        })
      ).toBe('"response_key": propertyName.flatMap { $0.snapshot }');
    });

    it('should generate expression for non-null composite', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: new GraphQLNonNull(schema.getType('Droid')),
        })
      ).toBe('"response_key": propertyName.snapshot');
    });

    it('should generate expression for nullable list of nullable composites', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: new GraphQLList(schema.getType('Droid')),
        })
      ).toBe('"response_key": propertyName.flatMap { $0.map { $0.flatMap { $0.snapshot } } }');
    });

    it('should generate expression for nullable list of non-null composites', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: new GraphQLList(new GraphQLNonNull(schema.getType('Droid'))),
        })
      ).toBe('"response_key": propertyName.flatMap { $0.map { $0.snapshot } }');
    });

    it('should generate expression for non-null list of nullable composites', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: new GraphQLNonNull(new GraphQLList(schema.getType('Droid'))),
        })
      ).toBe('"response_key": propertyName.map { $0.flatMap { $0.snapshot } }');
    });

    it('should generate expression for non-null list of non-null composites', () => {
      expect(
        generator.propertyAssignmentForField({
          responseKey: 'response_key',
          propertyName: 'propertyName',
          type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(schema.getType('Droid')))),
        })
      ).toBe('"response_key": propertyName.map { $0.snapshot }');
    });
  });

  describe('#structDeclarationForFragment()', () => {
    it(`should generate a struct declaration for a fragment with an abstract type condition`, () => {
      const { fragments } = compile(`
        fragment HeroDetails on Character {
          name
          appearsIn
        }
      `);

      generator.structDeclarationForFragment(fragments['HeroDetails']);

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a struct declaration for a fragment with a concrete type condition`, () => {
      const { fragments } = compile(`
        fragment DroidDetails on Droid {
          name
          primaryFunction
        }
      `);

      generator.structDeclarationForFragment(fragments['DroidDetails']);

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a struct declaration for a fragment with a subselection`, () => {
      const { fragments } = compile(`
        fragment HeroDetails on Character {
          name
          friends {
            name
          }
        }
      `);

      generator.structDeclarationForFragment(fragments['HeroDetails']);

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a struct declaration for a fragment that includes a fragment spread`, () => {
      const { fragments } = compile(`
        fragment HeroDetails on Character {
          name
          ...MoreHeroDetails
        }

        fragment MoreHeroDetails on Character {
          appearsIn
        }
      `);

      generator.structDeclarationForFragment(fragments['HeroDetails']);

      expect(generator.output).toMatchSnapshot();
    });
  });

  describe('#structDeclarationForSelectionSet()', () => {
    it(`should generate a struct declaration for a selection set`, () => {
      const { operations } = compile(`
        query Hero {
          hero {
            name
          }
        }
      `);

      const selectionSet = (operations['Hero'].selectionSet.selections[0] as Field).selectionSet as SelectionSet;

      generator.structDeclarationForSelectionSet({ structName: 'Hero', selectionSet });

      expect(generator.output).toMatchSnapshot();
    });

    it(`should escape reserved keywords in a struct declaration for a selection set`, () => {
      const { operations } = compile(`
        query Hero {
          hero {
            private: name
          }
        }
      `);

      const selectionSet = (operations['Hero'].selectionSet.selections[0] as Field).selectionSet as SelectionSet;

      generator.structDeclarationForSelectionSet({ structName: 'Hero', selectionSet });

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a nested struct declaration for a selection set with subselections`, () => {
      const { operations } = compile(`
        query Hero {
          hero {
            friends {
              name
            }
          }
        }
      `);

      const selectionSet = (operations['Hero'].selectionSet.selections[0] as Field).selectionSet as SelectionSet;

      generator.structDeclarationForSelectionSet({ structName: 'Hero', selectionSet });

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a struct declaration for a selection set with a fragment spread that matches the parent type`, () => {
      const { operations } = compile(`
        query Hero {
          hero {
            name
            ...HeroDetails
          }
        }

        fragment HeroDetails on Character {
          name
        }
      `);

      const selectionSet = (operations['Hero'].selectionSet.selections[0] as Field).selectionSet as SelectionSet;

      generator.structDeclarationForSelectionSet({ structName: 'Hero', selectionSet });

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a struct declaration for a selection set with a fragment spread with a more specific type condition`, () => {
      const { operations } = compile(`
        query Hero {
          hero {
            name
            ...DroidDetails
          }
        }

        fragment DroidDetails on Droid {
          name
        }
      `);

      const selectionSet = (operations['Hero'].selectionSet.selections[0] as Field).selectionSet as SelectionSet;

      generator.structDeclarationForSelectionSet({ structName: 'Hero', selectionSet });

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a struct declaration for a selection set with an inline fragment`, () => {
      const { operations } = compile(`
        query Hero {
          hero {
            name
            ... on Droid {
              primaryFunction
            }
          }
        }
      `);

      const selectionSet = (operations['Hero'].selectionSet.selections[0] as Field).selectionSet as SelectionSet;

      generator.structDeclarationForSelectionSet({ structName: 'Hero', selectionSet });

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a struct declaration for a fragment spread nested in an inline fragment`, () => {
      const { operations } = compile(`
        query Hero {
          hero {
            name
            ... on Droid {
              ...HeroDetails
            }
          }
        }

        fragment HeroDetails on Character {
          name
        }
      `);

      const selectionSet = (operations['Hero'].selectionSet.selections[0] as Field).selectionSet as SelectionSet;

      generator.structDeclarationForSelectionSet({ structName: 'Hero', selectionSet });

      expect(generator.output).toMatchSnapshot();
    });

    it(`should generate a struct declaration for a selection set with a conditional field`, () => {
      const { operations } = compile(`
        query Hero($includeName: Boolean!) {
          hero {
            name @include(if: $includeName)
          }
        }
      `);

      const selectionSet = (operations['Hero'].selectionSet.selections[0] as Field).selectionSet as SelectionSet;

      generator.structDeclarationForSelectionSet({ structName: 'Hero', selectionSet });

      expect(generator.output).toMatchSnapshot();
    });
  });

  describe('#typeDeclarationForGraphQLType()', () => {
    it('should generate an enum declaration for a GraphQLEnumType', () => {
      generator.typeDeclarationForGraphQLType(schema.getType('Episode'));

      expect(generator.output).toMatchSnapshot();
    });

    it('should escape identifiers in cases of enum declaration for a GraphQLEnumType', () => {
      const albumPrivaciesEnum = new GraphQLEnumType({
        name: 'AlbumPrivacies',
        values: { PUBLIC: { value: 'PUBLIC' }, PRIVATE: { value: 'PRIVATE' } },
      });

      generator.typeDeclarationForGraphQLType(albumPrivaciesEnum);

      expect(generator.output).toMatchSnapshot();
    });

    it('should generate a struct declaration for a GraphQLInputObjectType', () => {
      generator.typeDeclarationForGraphQLType(schema.getType('ReviewInput'));

      expect(generator.output).toMatchSnapshot();
    });
  });

  describe('#dictionaryLiteralForFieldArguments()', () => {
    it('should include expressions for input objects with variables', () => {
      const { operations } = compile(`
        mutation FieldArgumentsWithInputObjects($commentary: String!, $red: Int!) {
          createReview(episode: JEDI, review: { stars: 2, commentary: $commentary, favorite_color: { red: $red, blue: 100, green: 50 } }) {
            commentary
          }
        }
      `);

      const fieldArguments = (operations['FieldArgumentsWithInputObjects'].selectionSet.selections[0] as Field).args as Argument[];
      const dictionaryLiteral = generator.helpers.dictionaryLiteralForFieldArguments(fieldArguments);

      expect(dictionaryLiteral).toBe(
        '["episode": "JEDI", "review": ["stars": 2, "commentary": GraphQLVariable("commentary"), "favorite_color": ["red": GraphQLVariable("red"), "blue": 100, "green": 50]]]'
      );
    });
  });
});
