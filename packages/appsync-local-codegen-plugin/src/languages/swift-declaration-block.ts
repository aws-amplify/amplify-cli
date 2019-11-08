import { indent, indentMultiline } from '@graphql-codegen/visitor-plugin-common';
import { NameNode, StringValueNode } from 'graphql';

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

export type Access = 'private' | 'public' | 'DEFAULT';
export type VariableFlags = {
  list?: boolean;
  variable?: boolean;
};
export type StructFlags = VariableFlags & { optional?: boolean; static?: boolean };
export type PropertyFlags = StructFlags;
export type MethodFlags = { static?: boolean };
export type Kind = 'class' | 'struct' | 'extension' | 'enum';
export type VariableDeclaration = {
  value: string | undefined;
  name: string;
  type: string;
  flags: VariableFlags;
};
export type StructProperty = VariableDeclaration & {
  access: Access;
  comment?: string;
  getter?: string;
  setter?: string;
  flags: StructFlags;
};
export type MethodArgument = VariableDeclaration & {
  flags: PropertyFlags;
};
export type StructMethod = {
  args: MethodArgument[];
  implementation: string;
  name: string;
  access: Access;
  returnType: string | null;
  flags: MethodFlags;
  comment: string;
};
export class SwiftDeclarationBlock {
  _name: string = '';
  _kind: Kind = 'struct';
  _protocols: string[] = [];
  _access: Access = 'DEFAULT';
  _properties: StructProperty[] = [];
  _methods: StructMethod[] = [];
  _comment: string = '';
  _block: string | null = null;
  _enumValues: string[] = [];

  access(access: Access): SwiftDeclarationBlock {
    this._access = access;

    return this;
  }

  withComment(comment: string | StringValueNode | null): SwiftDeclarationBlock {
    if (comment) {
      this._comment = transformComment(comment, 0);
    }
    return this;
  }

  withName(name: string | NameNode): SwiftDeclarationBlock {
    this._name = typeof name === 'object' ? (name as NameNode).value : name;

    return this;
  }

  withBlock(block: string): SwiftDeclarationBlock {
    this._block = block;

    return this;
  }
  asKind(kind: Kind): SwiftDeclarationBlock {
    this._kind = kind;
    return this;
  }

  addProperty(
    name: string,
    type: string,
    value?: string,
    access: Access = 'public',
    flags: StructFlags = {},
    comment?: string,
    getter?: string,
    setter?: string
  ): SwiftDeclarationBlock {
    this._properties.push({
      name,
      type,
      value,
      access,
      flags: {
        optional: false,
        ...flags,
      },
      comment,
      getter,
      setter,
    });

    return this;
  }

  withProtocols(protocols: string[]): SwiftDeclarationBlock {
    this._protocols = protocols;
    return this;
  }

  addEnumValue(enumVal: string): SwiftDeclarationBlock {
    if (this._kind !== 'enum') {
      throw new Error(`Can not add enum values for block type ${this._kind}`);
    }
    this._enumValues.push(enumVal);
    return this;
  }

  addClassMethod(
    name: string,
    returnType: string | null,
    impl: string,
    args: MethodArgument[] = [],
    access: Access = 'public',
    flags: MethodFlags = {},
    comment: string = ''
  ): SwiftDeclarationBlock {
    this._methods.push({
      name,
      returnType,
      implementation: impl,
      args,
      access,
      flags,
      comment: transformComment(comment),
    });

    return this;
  }
  public get string(): string {
    if (this._kind === 'enum') {
      return this.generateEnumStr();
    }
    return this.generateStructOrExtensionStr();
  }

  private generateEnumStr(): string {
    const declarationHead = this.mergeSections(
      [this.getAccessStr(), this._kind, `${this._name}${this._protocols.length ? `: ${this._protocols.join(', ')}` : ''}`, '{'],
      false,
      ' '
    );
    const enumValues = this.mergeSections(this._enumValues.map(val => `case ${val}`), false);
    const declarationFoot = '}';
    return this.mergeSections([declarationHead, indentMultiline(enumValues), declarationFoot], false);
  }

  private generateStructOrExtensionStr(): string {
    const properties = this.mergeSections(
      [
        this._properties.length ? transformComment('MARK: properties') : '',
        ...this._properties.map(prop => this.generatePropertiesStr(prop)),
      ],
      false
    );

    const methods = this.mergeSections(
      this._methods.map(method => {
        const methodHeader = this.mergeSections(
          [
            method.access === 'DEFAULT' ? '' : method.access,
            method.flags.static ? 'static' : '',
            ['init', 'deinit'].includes(method.name) ? '' : 'func',
            method.name,
            '(',
            '\n',
            this.generateArgsStr(method.args),
            '\n',
            ')',
            method.returnType ? `-> ${method.returnType}` : '',
            '{',
          ],
          false,
          ' '
        );
        const methodFooter = '}';
        return this.mergeSections([method.comment, methodHeader, indentMultiline(method.implementation), methodFooter], false);
      }),
      false
    );

    const declarationHead = this.mergeSections(
      [this.getAccessStr(), this._kind, `${this._name}${this._protocols.length ? `: ${this._protocols.join(', ')}` : ''}`, '{'],
      false,
      ' '
    );
    const declarationBody = indentMultiline(this.mergeSections([properties, methods, this._block || '']));
    const declarationFoot = '}';
    return this.mergeSections([this._comment, declarationHead, declarationBody, declarationFoot], false);
  }

  private generateArgsStr(args: MethodArgument[]): string {
    const res: string[] = args.reduce((acc: string[], arg) => {
      const val: string | null = arg.value ? arg.value : arg.flags.list ? '[]' : arg.flags.optional ? 'nil' : null;
      const type = arg.type;
      acc.push([arg.name, ': ', type, !arg.flags.list && arg.flags.optional ? '?' : '', val ? ` = ${val}` : ''].join(''));
      return acc;
    }, []);

    return res.length > 1 ? indentMultiline(res.join(',\n')) : res.join(',');
  }

  private generatePropertiesStr(prop: StructProperty): string {
    let resultArr: string[] = [
      prop.access,
      prop.flags.static ? 'static' : '',
      prop.flags.variable ? 'var' : 'let',
      `${prop.name}:`,
      `${prop.type}${prop.flags.optional ? '?' : ''}`,
    ];

    const getterStr = prop.getter ? `{\n${indentMultiline(prop.getter)} \n}` : null;
    const setterStr = prop.setter ? `{\n${indentMultiline(prop.setter)} \n}` : null;
    let getterSetterStr = '';
    if (setterStr) {
      getterSetterStr = this.mergeSections(
        ['{', indentMultiline(`set: ${setterStr}`), getterStr ? indentMultiline(`get: ${getterStr}`) : '', '}'],
        false
      );
    } else if (getterStr) {
      getterSetterStr = indentMultiline(getterStr);
    }
    resultArr.push(getterSetterStr);

    if (prop.value) {
      resultArr.push('=');
      resultArr.push(prop.value);
    }
    return resultArr.filter(r => !!r).join(' ');
  }

  private getAccessStr(): string {
    return this._access === 'DEFAULT' ? '' : this._access;
  }

  mergeSections(sections: string[], insertNewLine: boolean = true, joinStr: string = '\n'): string {
    return sections
      .filter(section => !!section)
      .map(section => (insertNewLine ? `${section}\n` : section))
      .join(joinStr)
      .trimEnd();
  }
}
