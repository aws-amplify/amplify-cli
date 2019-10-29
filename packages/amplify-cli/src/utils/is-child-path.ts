import path from 'path';

export default function isChildPath(child: string, parent: string): boolean {
  if (child === parent) {
    return false;
  }
  const parentTokens = parent.split(path.sep).filter(i => i.length);
  const childTokens = child.split(path.sep).filter(i => i.length);
  return parentTokens.every((element, index) => childTokens[index] === element);
}
