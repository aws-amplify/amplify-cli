import { buildSchema, GraphQLSchema, parse, visit } from 'graphql';
import { TYPESCRIPT_SCALAR_MAP } from '../../scalars';
import { directives, scalars } from '../../scalars/supported-directives';
import {
  CodeGenConnectionType,
  CodeGenFieldConnectionBelongsTo,
  CodeGenFieldConnectionHasMany,
  CodeGenFieldConnectionHasOne,
} from '../../utils/process-connections';
import { AppSyncJSONVisitor, AssociationHasMany, JSONSchemaNonModel } from '../../visitors/appsync-json-metadata-visitor';
import { CodeGenEnum, CodeGenField, CodeGenModel } from '../../visitors/appsync-visitor';

const buildSchemaWithDirectives = (schema: String): GraphQLSchema => {
  return buildSchema([schema, directives, scalars].join('\n'));
};

const getVisitor = (schema: string, target: 'typescript' | 'javascript' | 'typeDeclaration' = 'javascript'): AppSyncJSONVisitor => {
  const ast = parse(schema);
  const builtSchema = buildSchemaWithDirectives(schema);
  const visitor = new AppSyncJSONVisitor(
    builtSchema,
    { directives, target: 'metadata', scalars: TYPESCRIPT_SCALAR_MAP, metadataTarget: target },
    {},
  );
  visit(ast, { leave: visitor });
  return visitor;
};

describe('Metadata visitor', () => {
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
  let visitor: AppSyncJSONVisitor;
  beforeEach(() => {
    visitor = getVisitor(schema);
  });

  describe('getType', () => {
    it('should return model type for Models', () => {
      expect((visitor as any).getType('SimpleModel')).toEqual({ model: 'SimpleModel' });
    });

    it('should return EnumType for Enum', () => {
      expect((visitor as any).getType('SimpleEnum')).toEqual({ enum: 'SimpleEnum' });
    });

    it('should return NonModel type for Non-model', () => {
      expect((visitor as any).getType('SimpleNonModelType')).toEqual({ nonModel: 'SimpleNonModelType' });
    });

    it('should throw error for unknown type', () => {
      expect(() => (visitor as any).getType('unknown')).toThrowError('Unknown type');
    });
  });

  describe('generateNonModelMetadata', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should generate nonModelMetadata', () => {
      const nonModelType = (visitor as any).getSelectedNonModels()['SimpleNonModelType'];
      const getFieldAssociationSpy = jest.spyOn(visitor as any, 'getFieldAssociation').mockReturnValueOnce(null);
      const getFieldNameSpy = jest.spyOn(visitor as any, 'getFieldName');
      // Second call return a mock association
      const namesAssociation: AssociationHasMany = {
        associatedWith: 'foo',
        connectionType: CodeGenConnectionType.HAS_MANY,
      };
      getFieldAssociationSpy.mockReturnValueOnce(namesAssociation);
      const getModelNameSpy = jest.spyOn(visitor as any, 'getModelName').mockReturnValueOnce('nonModel');

      const expectedValue: JSONSchemaNonModel = {
        name: 'nonModel',
        fields: {
          id: {
            name: 'id',
            isArray: false,
            type: 'ID',
            isRequired: true,
            attributes: [],
          },
          names: {
            name: 'names',
            isArray: true,
            type: 'String',
            isRequired: false,
            attributes: [],
            association: namesAssociation,
          },
        },
      };
      expect((visitor as any).generateNonModelMetadata(nonModelType)).toEqual(expectedValue);

      expect(getFieldAssociationSpy).toHaveBeenCalledTimes(2);
      expect(getFieldAssociationSpy).toHaveBeenNthCalledWith(1, nonModelType.fields[0]);
      expect(getFieldAssociationSpy).toHaveBeenNthCalledWith(2, nonModelType.fields[1]);

      expect(getModelNameSpy).toHaveBeenLastCalledWith(nonModelType);

      expect(getFieldNameSpy).toHaveBeenCalledTimes(2);
      expect(getFieldNameSpy).toHaveBeenNthCalledWith(1, nonModelType.fields[0]);
      expect(getFieldNameSpy).toHaveBeenNthCalledWith(2, nonModelType.fields[1]);
    });
  });

  describe('generateModelMetadata', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should generate model metadata', () => {
      const modelType = (visitor as any).getSelectedModels()['SimpleModel'];
      const nonModelMetadata: JSONSchemaNonModel = {
        name: 'SimpleModel',
        fields: {},
      };

      const getNonModelMetadataSpy = jest.spyOn(visitor as any, 'generateNonModelMetadata').mockReturnValueOnce(nonModelMetadata);
      const pluralizeSpy = jest.spyOn(visitor as any, 'pluralizeModelName').mockReturnValueOnce('SimpleModels');
      const generateModelAttributesSpy = jest.spyOn(visitor as any, 'generateModelAttributes').mockReturnValue([]);

      expect((visitor as any).generateModelMetadata(modelType)).toEqual({
        ...nonModelMetadata,
        syncable: true,
        pluralName: 'SimpleModels',
        attributes: [],
      });

      expect(getNonModelMetadataSpy).toHaveBeenCalledWith(modelType);
      expect(pluralizeSpy).toBeCalledWith(modelType);
      expect(generateModelAttributesSpy).toHaveBeenCalledWith(modelType);
    });
  });

  it('should generate model attributes', () => {
    const model: CodeGenModel = {
      directives: [
        {
          name: 'connection',
          arguments: {
            fields: ['f1', 'f2'],
            keyName: 'byName',
          },
        },
      ],
      name: 'testModel',
      fields: [],
      type: 'model',
    };
    expect((visitor as any).generateModelAttributes(model)).toEqual([
      {
        type: model.directives[0].name,
        properties: model.directives[0].arguments,
      },
    ]);
  });

  describe('getFieldAssociation', () => {
    let baseField: CodeGenField;
    beforeEach(() => {
      baseField = {
        directives: [],
        isNullable: true,
        isList: false,
        name: 'name',
        type: 'String',
      };
    });
    it('should return undefined if there is no connectionInfo', () => {
      expect((visitor as any).getFieldAssociation(baseField)).not.toBeDefined();
    });

    it('should include associatedWith when a field HAS_MANY or HAS_ONE connection', () => {
      const hasManyAssociation: CodeGenFieldConnectionHasMany = {
        kind: CodeGenConnectionType.HAS_MANY,
        connectedModel: {
          name: 'Connected',
          fields: [],
          directives: [],
          type: 'model',
        },
        associatedWith: {
          directives: [],
          isList: false,
          isNullable: false,
          name: 'associatedField',
          type: 'String',
        },
      };
      const getFieldNameSpy = jest.spyOn(visitor as any, 'getFieldName');
      const fieldWithHasManyConnection = { ...baseField, connectionInfo: hasManyAssociation };
      expect((visitor as any).getFieldAssociation(fieldWithHasManyConnection)).toEqual({
        connectionType: CodeGenConnectionType.HAS_MANY,
        associatedWith: 'associatedField',
      });
      expect(getFieldNameSpy).toHaveBeenCalledWith(hasManyAssociation.associatedWith);

      const hasOneAssociation: CodeGenFieldConnectionHasOne = { ...hasManyAssociation, kind: CodeGenConnectionType.HAS_ONE };
      const fieldWithHasOneConnection = { ...baseField, connectionInfo: hasOneAssociation };
      expect((visitor as any).getFieldAssociation(fieldWithHasOneConnection)).toEqual({
        connectionType: CodeGenConnectionType.HAS_ONE,
        associatedWith: 'associatedField',
      });
      expect(getFieldNameSpy).toHaveBeenCalledWith(hasOneAssociation.associatedWith);
    });

    it('should include targetName when a field BELONGS_TO connection', () => {
      const belongsToAssociation: CodeGenFieldConnectionBelongsTo = {
        kind: CodeGenConnectionType.BELONGS_TO,
        connectedModel: {
          name: 'Connected',
          fields: [],
          directives: [],
          type: 'model',
        },
        targetName: 'connectedId',
      };
      const getFieldNameSpy = jest.spyOn(visitor as any, 'getFieldName');
      const fieldWithBelongsToConnection = { ...baseField, connectionInfo: belongsToAssociation };
      expect((visitor as any).getFieldAssociation(fieldWithBelongsToConnection)).toEqual({
        connectionType: CodeGenConnectionType.BELONGS_TO,
        targetName: 'connectedId',
      });
      expect(getFieldNameSpy).not.toHaveBeenCalled();
    });

    it('should generate enum meta data', () => {
      const enumObj: CodeGenEnum = {
        name: 'MyEnum',
        type: 'enum',
        values: {
          val1: 'val1',
          val2: 'val2',
        },
      };
      expect((visitor as any).generateEnumMetadata(enumObj)).toEqual({
        name: 'MyEnum',
        values: ['val1', 'val2'],
      });
    });

    describe('generateMetadata', () => {
      beforeEach(() => {
        jest.resetAllMocks();
      });

      it('should include models, nonModels, enums and version info', () => {
        const generateModelSpy = jest.spyOn(visitor as any, 'generateModelMetadata');
        const generateNonModelSpy = jest.spyOn(visitor as any, 'generateNonModelMetadata');
        const generateEnumSpy = jest.spyOn(visitor as any, 'generateEnumMetadata');
        const computeVersionSpy = jest.spyOn(visitor as any, 'computeVersion');

        const metadata = (visitor as any).generateMetadata();

        expect(metadata).toMatchInlineSnapshot(`
          Object {
            "enums": Object {
              "SimpleEnum": Object {
                "name": "SimpleEnum",
                "values": Array [
                  "enumVal1",
                  "enumVal2",
                ],
              },
            },
            "models": Object {
              "SimpleModel": Object {
                "attributes": Array [
                  Object {
                    "properties": Object {},
                    "type": "model",
                  },
                ],
                "fields": Object {
                  "bar": Object {
                    "attributes": Array [],
                    "isArray": false,
                    "isRequired": false,
                    "name": "bar",
                    "type": "String",
                  },
                  "id": Object {
                    "attributes": Array [],
                    "isArray": false,
                    "isRequired": true,
                    "name": "id",
                    "type": "ID",
                  },
                  "name": Object {
                    "attributes": Array [],
                    "isArray": false,
                    "isRequired": false,
                    "name": "name",
                    "type": "String",
                  },
                },
                "name": "SimpleModel",
                "pluralName": "SimpleModels",
                "syncable": true,
              },
            },
            "nonModels": Object {
              "SimpleNonModelType": Object {
                "fields": Object {
                  "id": Object {
                    "attributes": Array [],
                    "isArray": false,
                    "isRequired": true,
                    "name": "id",
                    "type": "ID",
                  },
                  "names": Object {
                    "attributes": Array [],
                    "isArray": true,
                    "isRequired": false,
                    "name": "names",
                    "type": "String",
                  },
                },
                "name": "SimpleNonModelType",
              },
            },
            "version": "ace65a3762ae8764a52a487c71055733",
          }
        `);
        expect(generateModelSpy).toHaveBeenCalledTimes(1);
        // called twice because same function is used for model and non model types
        expect(generateNonModelSpy).toHaveBeenCalledTimes(2);
        expect(generateEnumSpy).toHaveBeenCalledTimes(1);
        expect(computeVersionSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('metadata snapshots', () => {
    it('should generate for Javascript', () => {
      const jsVisitor = getVisitor(schema, 'javascript');
      expect(jsVisitor.generate()).toMatchInlineSnapshot(`
        "export const schema = {
            \\"models\\": {
                \\"SimpleModel\\": {
                    \\"name\\": \\"SimpleModel\\",
                    \\"fields\\": {
                        \\"id\\": {
                            \\"name\\": \\"id\\",
                            \\"isArray\\": false,
                            \\"type\\": \\"ID\\",
                            \\"isRequired\\": true,
                            \\"attributes\\": []
                        },
                        \\"name\\": {
                            \\"name\\": \\"name\\",
                            \\"isArray\\": false,
                            \\"type\\": \\"String\\",
                            \\"isRequired\\": false,
                            \\"attributes\\": []
                        },
                        \\"bar\\": {
                            \\"name\\": \\"bar\\",
                            \\"isArray\\": false,
                            \\"type\\": \\"String\\",
                            \\"isRequired\\": false,
                            \\"attributes\\": []
                        }
                    },
                    \\"syncable\\": true,
                    \\"pluralName\\": \\"SimpleModels\\",
                    \\"attributes\\": [
                        {
                            \\"type\\": \\"model\\",
                            \\"properties\\": {}
                        }
                    ]
                }
            },
            \\"enums\\": {
                \\"SimpleEnum\\": {
                    \\"name\\": \\"SimpleEnum\\",
                    \\"values\\": [
                        \\"enumVal1\\",
                        \\"enumVal2\\"
                    ]
                }
            },
            \\"nonModels\\": {
                \\"SimpleNonModelType\\": {
                    \\"name\\": \\"SimpleNonModelType\\",
                    \\"fields\\": {
                        \\"id\\": {
                            \\"name\\": \\"id\\",
                            \\"isArray\\": false,
                            \\"type\\": \\"ID\\",
                            \\"isRequired\\": true,
                            \\"attributes\\": []
                        },
                        \\"names\\": {
                            \\"name\\": \\"names\\",
                            \\"isArray\\": true,
                            \\"type\\": \\"String\\",
                            \\"isRequired\\": false,
                            \\"attributes\\": []
                        }
                    }
                }
            },
            \\"version\\": \\"ace65a3762ae8764a52a487c71055733\\"
        };"
      `);
    });
    it('should generate for typescript', () => {
      const tsVisitor = getVisitor(schema, 'typescript');
      expect(tsVisitor.generate()).toMatchInlineSnapshot(`
        "import { Schema } from \\"@aws-amplify/datastore\\";

        export const schema: Schema = {
            \\"models\\": {
                \\"SimpleModel\\": {
                    \\"name\\": \\"SimpleModel\\",
                    \\"fields\\": {
                        \\"id\\": {
                            \\"name\\": \\"id\\",
                            \\"isArray\\": false,
                            \\"type\\": \\"ID\\",
                            \\"isRequired\\": true,
                            \\"attributes\\": []
                        },
                        \\"name\\": {
                            \\"name\\": \\"name\\",
                            \\"isArray\\": false,
                            \\"type\\": \\"String\\",
                            \\"isRequired\\": false,
                            \\"attributes\\": []
                        },
                        \\"bar\\": {
                            \\"name\\": \\"bar\\",
                            \\"isArray\\": false,
                            \\"type\\": \\"String\\",
                            \\"isRequired\\": false,
                            \\"attributes\\": []
                        }
                    },
                    \\"syncable\\": true,
                    \\"pluralName\\": \\"SimpleModels\\",
                    \\"attributes\\": [
                        {
                            \\"type\\": \\"model\\",
                            \\"properties\\": {}
                        }
                    ]
                }
            },
            \\"enums\\": {
                \\"SimpleEnum\\": {
                    \\"name\\": \\"SimpleEnum\\",
                    \\"values\\": [
                        \\"enumVal1\\",
                        \\"enumVal2\\"
                    ]
                }
            },
            \\"nonModels\\": {
                \\"SimpleNonModelType\\": {
                    \\"name\\": \\"SimpleNonModelType\\",
                    \\"fields\\": {
                        \\"id\\": {
                            \\"name\\": \\"id\\",
                            \\"isArray\\": false,
                            \\"type\\": \\"ID\\",
                            \\"isRequired\\": true,
                            \\"attributes\\": []
                        },
                        \\"names\\": {
                            \\"name\\": \\"names\\",
                            \\"isArray\\": true,
                            \\"type\\": \\"String\\",
                            \\"isRequired\\": false,
                            \\"attributes\\": []
                        }
                    }
                }
            },
            \\"version\\": \\"ace65a3762ae8764a52a487c71055733\\"
        };"
      `);
    });

    it('should generate for typeDeclaration', () => {
      const typeDeclaration = getVisitor(schema, 'typeDeclaration');
      expect(typeDeclaration.generate()).toMatchInlineSnapshot(`
"import { Schema } from '@aws-amplify/datastore';

export declare const schema: Schema;"
`);
    });
  });
});
