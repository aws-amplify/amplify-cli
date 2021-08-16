import {
  ArgumentNode,
  DirectiveNode,
  DocumentNode,
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  isListType,
  Kind,
  ListTypeNode,
  Location,
  NamedTypeNode,
  NameNode,
  NonNullTypeNode,
  ObjectTypeDefinitionNode,
  StringValueNode,
  TypeNode,
  valueFromASTUntyped,
  ValueNode,
} from 'graphql';
import {
  DEFAULT_SCALARS,
  getBaseType,
  isEnum,
  isScalar,
  ModelResourceIDs,
  unwrapNonNull,
  withNamedNodeNamed,
} from 'graphql-transformer-common';

// Todo: to be moved to core later. context.output.getObject would return wrapper type so its easier to manipulate
// objects

export class ArgumentWrapper {
  public readonly name: NameNode;
  public readonly value: ValueNode;
  constructor(argument: ArgumentNode) {
    this.name = argument.name;
    this.value = argument.value;
  }
  serialize = (): ArgumentNode => {
    return {
      kind: 'Argument',
      name: this.name,
      value: this.value,
    };
  };
}

export class DirectiveWrapper {
  private arguments: ArgumentWrapper[] = [];
  private name: NameNode;
  private location?: Location;
  constructor(node: DirectiveNode) {
    this.name = node.name;
    this.arguments = (node.arguments || []).map(arg => new ArgumentWrapper(arg));
    this.location = this.location;
  }
  public serialize = (): DirectiveNode => {
    return {
      kind: 'Directive',
      name: this.name,
      arguments: this.arguments.map(arg => arg.serialize()),
    };
  };
  public getArguments = <T>(defaultValue: Required<T>): Required<T> => {
    const argValues = this.arguments.reduce(
      (acc: Record<string, any>, arg: ArgumentWrapper) => ({
        ...acc,
        [arg.name.value]: valueFromASTUntyped(arg.value),
      }),
      {},
    );
    return Object.assign(defaultValue, argValues);
  };
}

export class GenericFieldWrapper {
  protected type: TypeNode;
  public readonly directives: DirectiveWrapper[];
  public loc?: Location;
  public name: string;
  constructor(field: FieldDefinitionNode | InputValueDefinitionNode) {
    this.type = field.type;
    this.name = field.name.value;
    this.loc = field.loc;
    this.directives = (field.directives || []).map(d => new DirectiveWrapper(d));
  }
  isList = (): boolean => {
    return isListType(this.type);
  };

  isNonNullable = (): boolean => {
    return this.type.kind === 'NonNullType';
  };

  makeNullable = (): boolean => {
    if (this.isNonNullable()) {
      this.type = (this.type as NonNullTypeNode).type;
      return true;
    }
    return false;
  };

  makeNonNullable = (): boolean => {
    if (!this.isNonNullable()) {
      this.type = { kind: 'NonNullType', type: this.type } as NonNullTypeNode;
      return true;
    }
    return false;
  };

  wrapListType = (): GenericFieldWrapper => {
    if (!this.isList()) {
      this.type = {
        kind: 'ListType',
        type: this.type,
      };
    }
    return this;
  };

  unWrapListType = (): boolean => {
    if (!this.isList()) {
      this.type = (this.type as ListTypeNode).type;
      return true;
    }
    return false;
  };
  public getBaseType = (): NamedTypeNode => {
    let node = this.type;
    while (node.kind === Kind.LIST_TYPE || node.kind === Kind.NON_NULL_TYPE) {
      node = node.type;
    }
    return node;
  };
  public getTypeName = (): string => {
    return this.getBaseType().name.value;
  };

  public isScalar = (): boolean => {
    const typeName = this.getTypeName();
    return Object.keys(DEFAULT_SCALARS).includes(typeName);
  };
}

// Todo: Create a wrapper for InputValueDefinination with default values
// export class InputValueDefinitionWrapper extends GenericFieldWrapper {
//          private defaultValue;
//          constructor(private node: InputValueDefinitionNode) {
//            super(node);
//            this.defaultValue = node.defaultValue;
//          }
//          serialize = (): InputValueDefinitionNode => {
//            return {
//              ...this.node,
//              type: this.type,
//              name: { kind: 'Name', value: this.name },
//              defaultValue: this.defaultValue,
//            };
//          };
//          static create = (name: string, type: string, defaultValue?: string|number|boolean| isNullable: boolean = false, isList: boolean = false): InputValueDefinitionWrapper => {

//          };
//  }

export class InputFieldWrapper extends GenericFieldWrapper {
  public readonly argumenets?: InputValueDefinitionNode[];
  public readonly description?: StringValueNode;
  public type: TypeNode;
  public readonly name: string;
  public readonly loc?: Location;

  constructor(protected field: InputValueDefinitionNode) {
    super(field);
    this.type = field.type;
    this.name = field.name.value;
  }

  public serialize = (): InputValueDefinitionNode => {
    return {
      ...this.field,
      kind: 'InputValueDefinition',
      name: { kind: 'Name', value: this.name },
      type: this.type,
      description: this.description,
      directives: this.directives?.map(d => d.serialize()),
    };
  };

  static fromField = (name: string, field: FieldDefinitionNode, document: DocumentNode): InputFieldWrapper => {
    const autoGeneratableFieldsWithType: Record<string, string[]> = {
      id: ['ID'],
      createdAt: ['AWSDateTime', 'String'],
      updatedAt: ['AWSDateTime', 'String'],
    };

    let type: TypeNode;

    if (
      Object.keys(autoGeneratableFieldsWithType).indexOf(name) !== -1 &&
      autoGeneratableFieldsWithType[name].indexOf(unwrapNonNull(field.type).name.value) !== -1
    ) {
      // ids are always optional. when provided the value is used.
      // when not provided the value is not used.
      type = unwrapNonNull(field.type);
    } else {
      type =
        isScalar(field.type) || isEnum(field.type, document)
          ? field.type
          : withNamedNodeNamed(field.type, ModelResourceIDs.NonModelInputObjectName(getBaseType(field.type)));
    }

    return new InputFieldWrapper({
      kind: 'InputValueDefinition',
      name: { kind: 'Name', value: name },
      type,
    });
  };

  static create = (name: string, type: string, isNullable = false, isList = false): InputFieldWrapper => {
    const field = new InputFieldWrapper({
      kind: 'InputValueDefinition',
      name: {
        kind: 'Name',
        value: name,
      },
      type: {
        kind: 'NamedType',
        name: {
          value: type,
          kind: 'Name',
        },
      },
    });
    if (!isNullable) {
      field.makeNonNullable();
    }
    if (isList) {
      field.wrapListType();
    }
    return field;
  };
}
export class FieldWrapper extends GenericFieldWrapper {
  public readonly argumenets?: InputValueDefinitionNode[];
  public readonly description?: StringValueNode;
  public readonly loc?: Location;

  // arguments to be added
  constructor(field: FieldDefinitionNode) {
    super(field);
    this.argumenets = [...(field.arguments || [])];
    this.description = field.description;
    this.loc = field.loc;
  }

  public serialize = (): FieldDefinitionNode => {
    return {
      kind: 'FieldDefinition',
      name: { kind: 'Name', value: this.name },
      type: this.type,
      arguments: this.argumenets,
      description: this.description,
      directives: this.directives?.map(d => d.serialize()),
    };
  };

  static create = (name: string, type: string, isNullable = false, isList = false): FieldWrapper => {
    const field = new FieldWrapper({
      kind: 'FieldDefinition',
      name: {
        kind: 'Name',
        value: name,
      },
      type: {
        kind: 'NamedType',
        name: {
          value: type,
          kind: 'Name',
        },
      },
    });
    if (!isNullable) {
      field.makeNonNullable();
    }
    if (isList) {
      field.wrapListType();
    }
    return field;
  };
}

export class ObjectDefinitionWrapper {
  public readonly directives?: DirectiveWrapper[];
  public readonly fields: FieldWrapper[];
  public readonly name: string;
  constructor(private node: ObjectTypeDefinitionNode) {
    this.directives = (node.directives || []).map(d => new DirectiveWrapper(d));
    this.fields = (node.fields || []).map(f => new FieldWrapper(f));
    this.name = node.name.value;
  }

  public serialize = (): ObjectTypeDefinitionNode => {
    return {
      ...this.node,
      name: {
        kind: 'Name',
        value: this.name,
      },
      fields: this.fields.map(f => f.serialize()),
      directives: this.directives?.map(d => d.serialize()),
    };
  };

  hasField = (name: string): boolean => {
    const field = this.fields.find(f => f.name === name);
    return field ? true : false;
  };

  getField = (name: string): FieldWrapper => {
    const field = this.fields.find(f => f.name === name);
    if (!field) {
      throw new Error(`Field ${name} missing in type ${this.name}`);
    }
    return field;
  };

  addField = (field: FieldWrapper): void => {
    if (this.hasField(field.name)) {
      throw new Error(`type ${this.name} has already a field with name ${field.name}`);
    }
    this.fields.push(field);
  };

  removeField = (field: FieldWrapper): void => {
    if (this.hasField(field.name)) {
      throw new Error(`type ${this.name} does not have the field with name ${field.name}`);
    }
    const index = this.fields.indexOf(field);

    this.fields.splice(index, 1);
  };

  static create = (name: string, fields: FieldDefinitionNode[] = [], directives: DirectiveNode[] = []): ObjectDefinitionWrapper => {
    return new ObjectDefinitionWrapper({
      kind: 'ObjectTypeDefinition',
      name: {
        kind: 'Name',
        value: name,
      },
      fields: fields,
      directives: directives,
    });
  };
}

export class InputObjectDefinitionWrapper {
  public readonly directives?: DirectiveWrapper[];
  public readonly fields: InputFieldWrapper[];
  public readonly name: string;
  constructor(private node: InputObjectTypeDefinitionNode) {
    this.directives = (node.directives || []).map(d => new DirectiveWrapper(d));
    this.fields = (node.fields || []).map(f => new InputFieldWrapper(f));
    this.name = node.name.value;
  }

  public serialize = (): InputObjectTypeDefinitionNode => {
    return {
      ...this.node,
      fields: this.fields.map(f => f.serialize()),
      directives: this.directives?.map(d => d.serialize()),
    };
  };
  hasField = (name: string): boolean => {
    const field = this.fields.find(f => f.name === name);
    return field ? true : false;
  };

  getField = (name: string): InputFieldWrapper => {
    const field = this.fields.find(f => f.name === name);
    if (!field) {
      throw new Error(`Field ${name} missing in type ${this.name}`);
    }
    return field;
  };

  addField = (field: InputFieldWrapper): void => {
    if (this.hasField(field.name)) {
      throw new Error(`type ${this.name} has already a field with name ${field.name}`);
    }
    this.fields.push(field);
  };

  removeField = (field: InputFieldWrapper): void => {
    if (this.hasField(field.name)) {
      throw new Error(`type ${this.name} does not have the field with name ${field.name}`);
    }
    const index = this.fields.indexOf(field);

    this.fields.splice(index, 1);
  };

  static create = (
    name: string,
    fields: InputValueDefinitionNode[] = [],
    directives: DirectiveNode[] = [],
  ): InputObjectDefinitionWrapper => {
    const wrappedObj = new InputObjectDefinitionWrapper({
      kind: 'InputObjectTypeDefinition',
      name: {
        kind: 'Name',
        value: name,
      },
      fields: [],
      directives: directives,
    });
    for (let field of fields) {
      const fieldWrapper = new InputFieldWrapper(field);
      wrappedObj.addField(fieldWrapper);
    }
    return wrappedObj;
  };

  static fromObject = (name: string, def: ObjectTypeDefinitionNode, document: DocumentNode): InputObjectDefinitionWrapper => {
    const inputObj: InputObjectTypeDefinitionNode = {
      kind: 'InputObjectTypeDefinition',
      name: { kind: 'Name', value: name },
      fields: [],
      directives: [],
    };

    const wrappedInput = new InputObjectDefinitionWrapper(inputObj);
    for (let f of def.fields || []) {
      const wrappedField = InputFieldWrapper.fromField(f.name.value, f, document);
      wrappedInput.fields.push(wrappedField);
    }
    return wrappedInput;
  };
}

export class EnumWrapper {
  public readonly name: string;
  public values: string[];
  public directives: DirectiveWrapper[];
  constructor(private node: EnumTypeDefinitionNode) {
    this.name = node.name.value;
    this.values = node.values?.map(v => v.name.value) || [];
    this.directives = (node.directives || []).map(d => new DirectiveWrapper(d));
  }

  addValue = (value: string): void => {
    this.values.push(value);
  };

  serialize = (): EnumTypeDefinitionNode => {
    return {
      ...this.node,
      name: {
        kind: 'Name',
        value: this.name,
      },
      directives: this.directives.map(d => d.serialize()),
      values: this.values.map(value => ({
        kind: 'EnumValueDefinition',
        name: {
          kind: 'Name',
          value: value,
        },
      })),
    };
  };
  static create = (name: string, values: string[] = []): EnumWrapper => {
    const wrappedEnum = new EnumWrapper({
      kind: 'EnumTypeDefinition',
      name: {
        kind: 'Name',
        value: name,
      },
      values: [],
    });
    values.forEach(val => {
      wrappedEnum.addValue(val);
    });
    return wrappedEnum;
  };
}
