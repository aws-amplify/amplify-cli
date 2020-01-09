import { indent, indentMultiline } from '@graphql-codegen/visitor-plugin-common';
import { NameNode, StringValueNode } from 'graphql';

function isStringValueNode(node: any): node is StringValueNode {
  return node && typeof node === 'object' && node.kind === 'StringValue';
}

function transformComment(comment: string | StringValueNode, indentLevel = 0): string {
  if (isStringValueNode(comment)) {
    comment = comment.value;
  }

  if (!comment || comment === '') {
    return '';
  }

  const lines = comment.split('\n');

  return lines
    .map((line, index) => {
      const isLast = lines.length === index + 1;
      const isFirst = index === 0;

      if (isFirst && isLast) {
        return indent(`// ${comment} \n`, indentLevel);
      }
      line = line.split('*/').join('*\\/');
      return indent(`${isFirst ? '/*' : ''} * ${line}${isLast ? '\n */\n' : ''}`, indentLevel);
    })
    .join('\n');
}

export type Access = 'private' | 'public' | 'DEFAULT';
export type VariableFlags = {
  isList?: boolean;
  variable?: boolean;
};
export type StructFlags = VariableFlags & { optional?: boolean; static?: boolean };
export type PropertyFlags = StructFlags;
export type MethodFlags = { static?: boolean };
export type DeclarationFlag = { final?: boolean };
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
  flags: PropertyFlags;
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
  _block: string[] = [];
  _enumValues: { [name: string]: string } = {};
  _flags: DeclarationFlag = { final: false };

  access(access: Access): SwiftDeclarationBlock {
    this._access = access;

    return this;
  }

  final(isFinal: boolean = true): SwiftDeclarationBlock {
    this._flags.final = isFinal;
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
    this._block = [block];

    return this;
  }
  appendBlock(block: string): SwiftDeclarationBlock {
    this._block.push(block);
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
    flags: PropertyFlags = {},
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

  addEnumValue(name: string, value?: string): SwiftDeclarationBlock {
    if (this._kind !== 'enum') {
      throw new Error(`Can not add enum values for block type ${this._kind}`);
    }

    this._enumValues[name] = value || name;
    return this;
  }

  addClassMethod(
    name: string,
    returnType: string | null,
    implementation: string,
    args: MethodArgument[] = [],
    access: Access = 'public',
    flags: MethodFlags = {},
    comment: string = ''
  ): SwiftDeclarationBlock {
    this._methods.push({
      name,
      returnType,
      implementation: implementation,
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
      [
        this._comment,
        this.getAccessStr(),
        this._kind,
        `${this._name}${this._protocols.length ? `: ${this._protocols.join(', ')}` : ''}`,
        '{',
      ],
      false,
      ' '
    );
    const enumValues = this.mergeSections(
      Object.entries(this._enumValues).map(([name, val]) => ['case', name, ...(name !== val ? ['=', `"${val}"`] : [])].join(' ')),
      false
    );
    const declarationFoot = '}';
    return this.mergeSections([declarationHead, indentMultiline(enumValues), declarationFoot], false);
  }

  private generateStructOrExtensionStr(): string {
    const properties = this.mergeSections([...this._properties.map(prop => this.generatePropertiesStr(prop))], false);

    const methods = this.mergeSections(
      this._methods.map(method => {
        const argsStr = this.generateArgsStr(method.args);
        const argWithParenthesis = argsStr.length ? ['(', indentMultiline(argsStr).trim(), ')'].join('') : '()';
        const methodHeader = this.mergeSections(
          [
            method.access === 'DEFAULT' ? '' : method.access,
            method.flags.static ? 'static' : '',
            ['init', 'deinit'].includes(method.name) ? '' : 'func',
            `${method.name}${argWithParenthesis}`,
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
      [
        this._flags.final ? 'final' : '',
        this.getAccessStr(),
        this._kind,
        `${this._name}${this._protocols.length ? `: ${this._protocols.join(', ')}` : ''}`,
        '{',
      ],
      false,
      ' '
    );
    const declarationBody = indentMultiline(this.mergeSections([...this._block, properties, methods]));
    const declarationFoot = '}';
    return this.mergeSections([this._comment, declarationHead, declarationBody, declarationFoot], false);
  }

  private generateArgsStr(args: MethodArgument[]): string {
    const res: string[] = args.reduce((acc: string[], arg) => {
      const val: string | null = arg.value ? arg.value : arg.flags.isList ? '[]' : arg.flags.optional ? 'nil' : null;
      const type = arg.flags.isList ? `List<${arg.type}>` : arg.type;
      acc.push([arg.name, ': ', type, arg.flags.optional ? '?' : '', val ? ` = ${val}` : ''].join(''));
      return acc;
    }, []);

    return res.length > 1 ? indentMultiline(res.join(',\n')) : res.join(',');
  }

  private generatePropertiesStr(prop: StructProperty): string {
    const propertyTypeName = prop.flags.isList ? `List<${prop.type}>` : prop.type;
    const propertyType = propertyTypeName ? `: ${propertyTypeName}${prop.flags.optional ? '?' : ''}` : '';
    let resultArr: string[] = [
      prop.access,
      prop.flags.static ? 'static' : '',
      prop.flags.variable ? 'var' : 'let',
      `${prop.name}${propertyType}`,
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
    const propDeclaration = resultArr.filter(r => !!r).join(' ');
    return this.mergeSections([prop.comment ? `${transformComment(prop.comment)}` : '', propDeclaration], false);
  }

  private getAccessStr(): string {
    return this._access === 'DEFAULT' ? '' : this._access;
  }

  mergeSections(sections: string[], insertNewLine: boolean = true, joinStr: string = '\n'): string {
    return sections
      .filter(section => !!section)
      .map(section => (insertNewLine ? `${section}\n` : section))
      .join(joinStr)
      .trim();
  }
}
