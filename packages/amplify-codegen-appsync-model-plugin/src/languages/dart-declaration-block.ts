import { NameNode, StringValueNode } from "graphql";
import { transformComment, indentMultiline } from "@graphql-codegen/visitor-plugin-common";
import stripIndent from "strip-indent";

type Kind = 'class' | 'interface' | 'enum';
type ClassMember = {
  name: string;
  type: string;
  value: string;
  annotations: string[];
  nullable: boolean;
}

export class DartDeclarationBlock {
  _name: string | null = null;
  _kind: Kind = 'class';
  _implementsStr: string[] = [];
  _comment: string | null = null;
  _annotations: string[] = [];
  _members: ClassMember[] = [];

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
    annotations: string[] = [],
    nullable: boolean
  ): DartDeclarationBlock {
    this._members.push({
      name,
      type,
      value,
      annotations,
      nullable,
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

        let implementsStr = '';
        let annotatesStr = '';

        if (this._implementsStr.length > 0) {
          implementsStr = `implements ${this._implementsStr.join(', ')}`;
        }

        if (this._annotations.length > 0) {
          annotatesStr = this._annotations.map(a => `@${a}`).join('\n') + '\n';
        }

        result += `${annotatesStr}${this._kind} ${name} ${implementsStr} `
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
    const annotationStr : string = (member.annotations || []).map(annotation => `@${annotation}`).join('\n') + '\n';
    const typeStr = member.nullable ? member.type + '?' : member.type;
    const components = [
      typeStr,
      member.name,
    ].filter(f => f);
    return annotationStr + components.join(' ') + (member.value ? ` = ${member.value}` : '');
  }
}