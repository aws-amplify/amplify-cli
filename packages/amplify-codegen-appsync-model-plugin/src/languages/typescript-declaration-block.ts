import { indent, indentMultiline } from '@graphql-codegen/visitor-plugin-common';
import { StringValueNode } from 'graphql';

function isStringValueNode(node: any): node is StringValueNode {
  return node && typeof node === 'object' && node.kind === 'StringValue';
}

function transformComment(comment: string | StringValueNode, indentLevel = 0): string {
  if (!comment || comment === '') {
    return '';
  }

  if (isStringValueNode(comment)) {
    comment = comment.value;
  }

  comment = comment.split('*/').join('*\\/');
  const lines = comment.split('\n');

  return lines
    .map((line, index) => {
      const isLast = lines.length === index + 1;
      const isFirst = index === 0;

      if (isFirst && isLast) {
        return indent(`// ${comment} */\n`, indentLevel);
      }

      return indent(`${isFirst ? '/*' : ''} * ${line}${isLast ? '\n */\n' : ''}`, indentLevel);
    })
    .join('\n');
}

export type Access = 'private' | 'public' | 'DEFAULT' | 'protected';
export type VariableFlag = {
  readonly?: boolean;
  static?: boolean;
};
export type VariableDeclaration = {
  name: string;
  type: string;
  flags?: VariableFlag;
  value?: string;
};
export type PropertyFlag = VariableFlag & {
  optional?: boolean;
};
export type Property = VariableDeclaration & {
  access: Access;
  flags: PropertyFlag;
};
export type MethodArguments = VariableDeclaration;
export type MethodFlag = {
  static?: boolean;
};
export type Method = {
  name: string;
  args: MethodArguments[];
  access: Access;
  returnType: string | null;
  flags: MethodFlag;
  implmentation: string | null;
  comment: string;
};

export type EnumValues = {
  [name: string]: string;
};
export type DeclarationKind = 'class' | 'enum' | 'interface';
export type DeclarationFlags = {
  isDeclaration?: boolean;
  shouldExport?: boolean;
};
export class TypeScriptDeclarationBlock {
  protected _name: string = '';
  protected _kind: DeclarationKind = 'class';
  protected _extends: string[] = [];
  protected _properties: Property[] = [];
  protected _methods: Method[] = [];
  protected _flags: DeclarationFlags = {
    isDeclaration: false,
    shouldExport: false,
  };
  protected _comments: string = '';
  protected _block: string = '';
  protected _enumValues: EnumValues = {};

  public withName(name: string): TypeScriptDeclarationBlock {
    this._name = name;
    return this;
  }

  public export(shouldExport: boolean = true): TypeScriptDeclarationBlock {
    this._flags.shouldExport = shouldExport;
    return this;
  }

  public withComment(comment: string | StringValueNode): TypeScriptDeclarationBlock {
    this._comments = transformComment(comment);
    return this;
  }

  public withBlock(block: string): TypeScriptDeclarationBlock {
    this._block = block;
    return this;
  }
  public asKind(kind: DeclarationKind): TypeScriptDeclarationBlock {
    this._kind = kind;
    return this;
  }
  public withFlag(flags: Partial<DeclarationFlags>): TypeScriptDeclarationBlock {
    this._flags = { ...this._flags, ...flags };
    return this;
  }

  public addEnumValue(name: string, value?: string): void {
    if (this._kind !== 'enum') {
      throw new Error('Can not add enum values for non enum kind');
    }
    this._enumValues[name] = value !== undefined ? value : name;
  }

  public withEnumValues(values: { [name: string]: string } | string[]): TypeScriptDeclarationBlock {
    if (Array.isArray(values)) {
      values.forEach(val => this.addEnumValue(val));
    } else {
      Object.entries(values).forEach(([name, val]) => this.addEnumValue(name, val));
    }
    return this;
  }

  public addProperty(name: string, type: string, value?: string, access: Access = 'DEFAULT', flags: PropertyFlag = {}): void {
    if (this._kind === 'enum') {
      throw new Error('Can not add property to enum kind');
    }
    this._properties.push({
      name,
      type,
      flags,
      access,
      value,
    });
  }

  public addClassMethod(
    name: string,
    returnType: string | null,
    implmentation: string | null,
    args: MethodArguments[] = [],
    access: Access = 'DEFAULT',
    flags: MethodFlag = {},
    comment: string = ''
  ): void {
    if (this._kind === 'enum') {
      throw new Error('Can not add method to enum kind');
    }
    this._methods.push({
      name,
      returnType,
      implmentation,
      args,
      flags,
      access,
      comment: transformComment(comment),
    });
  }

  public get string(): string {
    switch (this._kind) {
      case 'interface':
        return this.generateInterface();
      case 'class':
        return this.generateClass();
      case 'enum':
        return this.generateEnum();
    }
  }

  protected generateEnum(): string {
    if (this._kind !== 'enum') {
      throw new Error(`generateEnum called for non enum kind(${this._kind})`);
    }
    const header = ['export', 'enum', this._name].join(' ');
    const body = Object.entries(this._enumValues)
      .map(([name, value]) => `${name} = "${value}"`)
      .join(',\n');
    return [`${header} {`, indentMultiline(body), '}'].join('\n');
  }

  protected generateClass(): string {
    const header: string[] = [
      this._flags.shouldExport ? 'export' : '',
      this._flags.isDeclaration ? 'declare' : '',
      'class',
      this._name,
      '{',
    ];
    if (this._extends.length) {
      header.push(['extends', this._extends.join(', ')].join(' '));
    }
    const body: string[] = [this.generateProperties(), this.generateMethods()];

    return [`${header.filter(h => h).join(' ')}`, indentMultiline(body.join('\n')), '}'].join('\n');
  }

  protected generateProperties(): string {
    const props = this._properties.map(prop => {
      const result: string[] = [];
      if (prop.access !== 'DEFAULT') {
        result.push(prop.access);
      }
      if (prop.flags && prop.flags.readonly) {
        result.push('readonly');
      }

      result.push(this.generatePropertyName(prop));

      if (prop.value) {
        result.push(` = ${prop.type};`);
      }

      return result.join(' ');
    });
    return props.map(propDeclaration => `${propDeclaration};`).join('\n');
  }

  protected generateMethods(): string {
    const methods: string[] = this._methods.map(method => {
      const methodAccessAndName = [];
      if (method.access !== 'DEFAULT') {
        methodAccessAndName.push(method.access);
      }
      if (method.flags.static) {
        methodAccessAndName.push('static');
      }
      methodAccessAndName.push(method.name);

      const args = method.args
        .map(arg => {
          return `${arg.name}${arg.type ? `: ${arg.type}` : ''}`;
        })
        .join(', ');

      const returnType = method.returnType ? `: ${method.returnType}` : '';
      const methodHeaderStr = `${methodAccessAndName.join(' ')}(${args})${returnType}`;

      if (this._flags.isDeclaration) {
        return `${methodHeaderStr};`;
      }
      return [`${methodHeaderStr}`, '{', method.implmentation ? indentMultiline(method.implmentation) : '', '}'].join('\n');
    });
    return methods.join('\n');
  }

  protected generateInterface(): string {
    throw new Error('Not implemented yet');
  }
  protected generatePropertyName(property: Property): string {
    let propertyName: string = property.name;
    if (property.flags.optional) {
      propertyName = `${propertyName}?`;
    }

    return property.type ? `${propertyName}: ${property.type}` : propertyName;
  }
}
