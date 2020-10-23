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
}
type ClassMethod = {
  name: string;
  returnType: string | null;
  args: string[];
  implementation: string;
  flags: MemberFlags;
  annotations?: string[];
}

export class DartDeclarationBlock {
  _name: string | null = null;
  _kind: Kind = 'class';
  _implementsStr: string[] = [];
  _extendStr: string[] = [];
  _extensionType: string | null = null;
  _comment: string | null = null;
  _annotations: string[] = [];
  _members: ClassMember[] = [];
  _methods: ClassMethod[] = [];

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
    flags: MemberFlags = {}
  ): DartDeclarationBlock {
    this._members.push({
      name,
      type,
      value,
      flags: {
        ...flags,
      }
    });
    return this;
  }

  addClassMethod(
    name: string,
    returnType: string | null,
    args: string[] = [],
    implementation: string,
    flags: MemberFlags = {},
    annotations?: string[],
  ) : DartDeclarationBlock {
    this._methods.push({
      name,
      returnType,
      args,
      implementation,
      annotations,
      flags: {
        ...flags
      }
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
      const before = '{';
      const after = '}';
      const block = [before, members, after].filter(f => f).join('\n');
      result += block;

      return (this._comment ? this._comment : '') + result + '\n';
  }

  private printMember(member: Partial<ClassMember>): string {
    const flags = member.flags || {};
    const components = [
      flags.static ? 'static' : null,
      flags.final ? 'final' : null,
      flags.const ? 'const' : null,
      flags.var ? 'var' : null,
      member.type,
      member.name,
    ].filter(f => f);
    return components.join(' ') + (member.value ? ` = ${member.value}` : '');
  }
}