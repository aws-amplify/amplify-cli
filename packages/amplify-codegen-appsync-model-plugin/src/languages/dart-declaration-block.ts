import { NameNode, StringValueNode } from "graphql";
import { transformComment, indentMultiline } from "@graphql-codegen/visitor-plugin-common";
import stripIndent from "strip-indent";

type Kind = 'class' | 'interface' | 'enum' | 'extension';
type MemberFlags = { final?: boolean; static?: boolean; const?: boolean; var?: boolean};
type ClassMember = {
  name: string;
  type: string;
  value: string;
  flags: MemberFlags;
  annotations: string[];
}
type ClassMethod = {
  name: string;
  returnType: string | null;
  args: Partial<ClassMember>[];
  implementation: string;
  flags: MethodFlags;
  annotations: string[];
  comment: string;
}
type MethodFlags = MemberFlags & {
  isGetter?: boolean;
  isBlock?: boolean;
}

export class DartDeclarationBlock {
  _name: string | null = null;
  _kind: Kind | null = null;
  _implementsStr: string[] = [];
  _extendStr: string[] = [];
  _extensionType: string | null = null;
  _comment: string | null = null;
  _annotations: string[] = [];
  _members: ClassMember[] = [];
  _methods: ClassMethod[] = [];
  _blocks: DartDeclarationBlock[] = [];

  addBlock(block: DartDeclarationBlock) {
    this._blocks.push(block);
    return this;
  }

  annotate(annotations: string[]): DartDeclarationBlock {
    this._annotations = annotations;
    return this;
  }

  asKind(kind: Kind): DartDeclarationBlock {
    this._kind = kind;
    return this;
  }

  implements(implementsStr: string[]): DartDeclarationBlock {
    this._implementsStr = implementsStr;
    return this;
  }

  extends(extendsStr: string[]): DartDeclarationBlock {
    this._extendStr = extendsStr;
    return this;
  }

  extensionOn(extensionType: string): DartDeclarationBlock {
    this._extensionType = extensionType;
    return this;
  }

  withName(name: string | NameNode): DartDeclarationBlock {
    this._name = typeof name === 'object' ? (name as NameNode).value : name;
    return this;
  }

  withComment(comment: string | StringValueNode | null): DartDeclarationBlock {
    if(comment) {
        this._comment = transformComment(comment, 0);
    }
    return this;
  }

  addClassMember(
    name: string,
    type: string,
    value: string,
    flags: MemberFlags = {},
    annotations: string[] = []
  ): DartDeclarationBlock {
    this._members.push({
      name,
      type,
      value,
      flags: {
        ...flags,
      },
      annotations
    });
    return this;
  }

  addClassMethod(
    name: string,
    returnType: string | null,
    args: Partial<ClassMember>[] = [],
    implementation: string,
    flags: MethodFlags = {},
    annotations: string[] = [],
    comment: string = '',
  ) : DartDeclarationBlock {
    this._methods.push({
      name,
      returnType,
      args,
      implementation,
      annotations,
      flags: {
        isBlock: true,
        ...flags
      },
      comment
    });
    return this;
  }

  public get string(): string {
      let result = '';
      if(this._kind) {
        let name = '';

        if (this._name) {
          name = this._name;
        }

        let extendsStr = '';
        let implementsStr = '';
        let extensionStr = '';
        let annotatesStr = '';

        if (this._extendStr.length > 0) {
          extendsStr = ` extends ${this._extendStr.join(', ')}`;
        }

        if (this._implementsStr.length > 0) {
          implementsStr = ` implements ${this._implementsStr.join(', ')}`;
        }

        if(this._extensionType) {
          extensionStr = ` on ${this._extensionType}`;
        }

        if (this._annotations.length > 0) {
          annotatesStr = this._annotations.map(a => `@${a}`).join('\n') + '\n';
        }

        result += `${annotatesStr}${this._kind} ${name}${extendsStr}${implementsStr}${extensionStr} `;
      }
      const members = this._members.length
        ? indentMultiline(stripIndent(this._members.map(member => this.printMember(member) + ';').join('\n')))
        : null;
      const methods = this._methods.length
        ? indentMultiline(stripIndent(this._methods.map(method => this.printMethod(method)).join('\n\n')))
        : null;
      const blocks = this._blocks.length ? this._blocks.map(b =>
          b._kind ? indentMultiline(b.string) : b.string).join('\n\n') : null;
      const before = this._kind ? '{' : '';
      const after = this._kind ? '}' : '';
      const blockStr = [members, methods, blocks].filter(f => f).join('\n\n');
      result += [before, blockStr, after].filter(f => f).join('\n');

      return (this._comment ? this._comment : '') + result;
  }

  private printMember(member: Partial<ClassMember>): string {
    const flags = member.flags || {};
    const annotations = member.annotations || [];
    let annotatesStr = '';
    if (annotations.length) {
      annotatesStr = annotations.map(a => `@${a}`).join('\n') + '\n';
    }
    const components = [
      flags.static ? 'static' : null,
      flags.final ? 'final' : null,
      flags.const ? 'const' : null,
      flags.var ? 'var' : null,
      member.type,
      member.name,
    ].filter(f => f);
    return annotatesStr + components.join(' ') + (member.value ? ` = ${member.value}` : '');
  }

  private printMethod(method: ClassMethod): string {
    const signature = [
      method.flags.static ? 'static' : null,
      method.flags.final ? 'final' : null,
      method.flags.const ? 'const' : null,
      method.returnType,
      method.name,
    ].filter(f => f).join(' ');
    const args = !method.flags.isGetter
        ? `(${method.args.map(arg => this.printMember(arg)).join(', ')})`
        : '';
    const comment = method.comment ? transformComment(method.comment) : '';
    const annotations = method.annotations.map(a => `@${a}\n`).join('');
    const implementation = method.flags.isBlock
        ? [' {', indentMultiline(method.implementation), '}'].join('\n')
        : method.implementation;
    return [
      comment,
      annotations,
      signature,
      args,
      implementation
    ].join('');
  }
}