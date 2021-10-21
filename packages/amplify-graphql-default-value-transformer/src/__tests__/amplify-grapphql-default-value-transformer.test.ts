import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { parse } from 'graphql';
import { DefaultValueTransformer } from '..';

describe('DefaultValueModelTransformer: ', () => {
  it('throws if @default is used in a non-@model type', () => {
    const schema = `
      type Test {
        id: ID!
        name: String @default(value: "hello world")
      }`;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('The @default directive may only be added to object definitions annotated with @model.');
  });

  it('throws if @default is used on a non scalar or enum field', () => {
    const schema = `
      type Test @model {
        id: ID!
        student: Student @default(value: "{'name':'FooBar'}")
      }

      type Student {
        name: String
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('The @default directive may only be added to scalar or enum field types.');
  });

  it('throws if @default is used with a null value', () => {
    const schema = `
      type Test @model {
        id: ID!
        name: String @default
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('Directive "@default" argument "value" of type "String!" is required, but it was not provided.');
  });

  it('throws if @default is used with invalid type. Int check.', () => {
    const schema = `
      type Test @model {
        id: ID!
        value: Int @default(value: "text")
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('Default value "text" is not a valid Int.');
  });

  it('throws if @default is used with invalid type. Boolean check.', () => {
    const schema = `
      type Test @model {
        id: ID!
        value: Boolean @default(value: "text")
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('Default value "text" is not a valid Boolean.');
  });

  it('throws if @default is used with invalid type. AWSJSON check.', () => {
    const schema = `
      type Test @model {
        id: ID!
        value: AWSJSON @default(value: "text")
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('Default value "text" is not a valid AWSJSON.');
  });

  it('throws if @default is used with invalid type. AWSDate check.', () => {
    const schema = `
      type Test @model {
        id: ID!
        value: AWSDate @default(value: "text")
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('Default value "text" is not a valid AWSDate.');
  });

  it('throws if @default is used with invalid type. AWSDateTime check.', () => {
    const schema = `
      type Test @model {
        id: ID!
        value: AWSDateTime @default(value: "text")
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('Default value "text" is not a valid AWSDateTime.');
  });

  it('throws if @default is used with invalid type. AWSTime check.', () => {
    const schema = `
      type Test @model {
        id: ID!
        value: AWSTime @default(value: "text")
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('Default value "text" is not a valid AWSTime.');
  });

  it('throws if @default is used with invalid type. AWSTimestamp check.', () => {
    const schema = `
      type Test @model {
        id: ID!
        value: AWSTimestamp @default(value: "text")
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('Default value "text" is not a valid AWSTimestamp.');
  });

  it('throws if @default is used with invalid type. AWSURL check.', () => {
    const schema = `
      type Test @model {
        id: ID!
        value: AWSURL @default(value: "text")
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('Default value "text" is not a valid AWSURL.');
  });

  it('throws if @default is used with invalid type. AWSPhone check.', () => {
    const schema = `
      type Test @model {
        id: ID!
        value: AWSPhone @default(value: "text")
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('Default value "text" is not a valid AWSPhone.');
  });

  it('throws if @default is used with invalid type. AWSIPAddress check.', () => {
    const schema = `
      type Test @model {
        id: ID!
        value: AWSIPAddress @default(value: "text")
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('Default value "text" is not a valid AWSIPAddress.');
  });

  it('should validate enum values', async () => {
    const inputSchema = `
      type Post @model {
        id: ID!
        enumValue: Tag @default(value: "INVALID")
      }

      enum Tag {
        NEWS
        RANDOM
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(inputSchema);
    }).toThrow('Default value "INVALID" is not a member of Tag enum.');
  });

  it('throws if @default is used on a required field.', () => {
    const schema = `
      type Test @model {
        id: ID!
        value: AWSIPAddress! @default(value: "text")
      }
    `;

    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });

    expect(() => {
      transformer.transform(schema);
    }).toThrow('The @default directive cannot be added to required fields.');
  });

  it('should successfully transform simple valid schema', async () => {
    const inputSchema = `
      type Post @model {
        id: ID!
        stringValue: String @default(value: "hello world")
        intVal: Int @default(value: "10002000")
        floatValue: Float @default(value: "123456.34565")
        booleanValue: Boolean @default(value: "true")
        awsJsonValue: AWSJSON @default(value: "{\\\"a\\\":1, \\\"b\\\":3, \\\"string\\\": 234}")
        awsDateValue: AWSDate @default(value: "2016-01-29")
        awsTimestampValue: AWSTimestamp @default(value: "545345345")
        awsEmailValue: AWSEmail @default(value: "local-part@domain-part")
        awsURLValue: AWSURL @default(value: "https://www.amazon.com/dp/B000NZW3KC/")
        awsPhoneValue: AWSPhone @default(value: "+41 44 668 18 00")
        awsIPAddressValue1: AWSIPAddress @default(value: "123.12.34.56")
        awsIPAddressValue2: AWSIPAddress @default(value: "1a2b:3c4b::1234:4567")
        enumValue: Tag @default(value: "RANDOM")
        awsTimeValue: AWSTime @default(value: "12:00:34Z")
        awsDateTime: AWSDateTime @default(value: "2007-04-05T14:30:34Z")
      }

      enum Tag {
        NEWS
        RANDOM
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new DefaultValueTransformer()],
    });
    const out = transformer.transform(inputSchema);
    expect(out).toBeDefined();
    expect(out.schema).toMatchSnapshot();

    const schema = parse(out.schema);
    validateModelSchema(schema);
  });
});
