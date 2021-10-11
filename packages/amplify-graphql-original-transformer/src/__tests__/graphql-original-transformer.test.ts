import { DirectiveNode, ObjectTypeDefinitionNode } from 'graphql';
import { TransformerSchemaVisitStepContextProvider } from '../../../amplify-graphql-transformer-interfaces/lib';
import { OriginalTransformer } from '../graphql-original-transformer';

describe('@original directive', () => {
  let stubDefinition: ObjectTypeDefinitionNode;
  let stubDirective: DirectiveNode;

  const registerModelToTableNameMapping_mock = jest.fn();

  const stubContext = {
    resourceHelper: {
      registerModelToTableNameMapping: registerModelToTableNameMapping_mock,
    },
  } as unknown as TransformerSchemaVisitStepContextProvider;

  const origTransformer = new OriginalTransformer();

  beforeEach(() => {
    jest.clearAllMocks();

    stubDefinition = {
      name: {
        value: 'TestName',
      },
    } as ObjectTypeDefinitionNode;
    stubDirective = {
      arguments: [
        {
          name: {
            value: 'name',
          },
          value: {
            kind: 'StringValue',
            value: 'OriginalName',
          },
        },
      ],
    } as unknown as DirectiveNode;
  });

  it('requires a name to be specified', () => {
    (stubDirective as any).arguments = [];
    expect(() => origTransformer.object(stubDefinition, stubDirective, stubContext)).toThrowErrorMatchingInlineSnapshot(
      `"name is required in @original directive"`,
    );
  });

  it('requires a string value for name', () => {
    (stubDirective as any).arguments[0].value.kind = 'OtherKind';
    expect(() => origTransformer.object(stubDefinition, stubDirective, stubContext)).toThrowErrorMatchingInlineSnapshot(
      `"A single string must be provided for \\"name\\" in @original directive"`,
    );
  });

  it('registers the rename mapping', () => {
    origTransformer.object(stubDefinition, stubDirective, stubContext);
    expect(registerModelToTableNameMapping_mock.mock.calls[0]).toEqual(['TestName', 'OriginalName']);
  });
});
