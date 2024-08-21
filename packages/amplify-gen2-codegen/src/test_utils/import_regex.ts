export const getImportRegex = (importIdentifier: string, importPackage: string) =>
  new RegExp(`import[\\s\\{a-zA-Z,]*${importIdentifier}[\\s,a-zA-Z]*\\} from "${importPackage}";`);
